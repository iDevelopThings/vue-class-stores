import {ComponentState, Context, setupDevtoolsPlugin} from "@vue/devtools-api";
import type {App, DevtoolsPluginApi} from "@vue/devtools-api/lib/esm/api";
import {CustomInspectorNode} from "@vue/devtools-api/lib/esm/api/api";
import {CustomState, StateBase} from "@vue/devtools-api/lib/esm/api/component";
import {HookPayloads, Hooks} from "@vue/devtools-api/lib/esm/api/hooks";
import {throttle} from "lodash";
import {BaseStore} from "../Lib";
import StoreManager from "../Lib/StoreManager";
import type {PluginOptions} from "./Types";

const inspectorId = 'vue-class-stores-plugin';

export class DevtoolsInstance {
	private api: DevtoolsPluginApi<PluginOptions>;

	private selectedInspectorNode: { nodeId: string, storeBinding: string } = {nodeId : null, storeBinding : null};

	public setup(app: App) {
		setupDevtoolsPlugin({
			id          : inspectorId,
			label       : 'Vue Class Stores',
			packageName : 'vue-class-stores',
			app
		}, this.configurePlugin.bind(this));
	}

	private configurePlugin(api: DevtoolsPluginApi<PluginOptions>) {
		this.api = api;

		this.api.addInspector({
			id              : inspectorId,
			label           : 'Class Stores',
			icon            : 'receipt_long',
			noSelectionText : 'Select a store to inspect it',
			actions         : [
				{
					icon    : 'delete_sweep',
					tooltip : 'Reset selected store',
					action  : () => {
						if (!this.selectedInspectorNode?.nodeId) {
							console.warn('No store selected, click one of your stores first.');
							return;
						}

						const {store, instance} = StoreManager.manager(this.selectedInspectorNode.nodeId);

						instance.$reset();

						console.log('Reset store', store, instance);
					}
				}
			]
		});

		this.api.on.inspectComponent(this.onInspectComponent.bind(this));
		this.api.on.editComponentState(this.onEditComponentState.bind(this));
		this.api.on.getInspectorTree(this.onGetInspectorTree.bind(this));
		this.api.on.getInspectorState(this.onGetInspectorState.bind(this));
		this.api.on.editInspectorState(this.onEditInspectorState.bind(this));
	}

	/**
	 * Add all of our stores into the inspector tree(there's no child stores, so it's a single list)
	 * @param {HookPayloads[Hooks.GET_INSPECTOR_TREE]} payload
	 * @param {Context} context
	 * @private
	 */
	private onGetInspectorTree(payload: HookPayloads[Hooks.GET_INSPECTOR_TREE], context: Context) {
		if (payload.inspectorId !== inspectorId) {
			return;
		}

		payload.rootNodes = [];

		for (let storeKey in StoreManager.stores) {
			const {store, instance} = StoreManager.manager(storeKey);

			const node: CustomInspectorNode = {
				id    : store.getVueBinding(),
				label : store.getName(),
				tags  : [
					{
						label           : store.getVueBinding(),
						textColor       : 0x000000,
						backgroundColor : 0xff984f
					}
				]
			};

			payload.rootNodes.push(node);
		}

	}

	/**
	 * Handle displaying the inspector state when we click on a store in the list
	 *
	 * @param {HookPayloads[Hooks.GET_INSPECTOR_STATE]} payload
	 * @param {Context} context
	 * @private
	 */
	private onGetInspectorState(payload: HookPayloads[Hooks.GET_INSPECTOR_STATE], context: Context) {
		if (payload.inspectorId !== inspectorId) {
			return;
		}

		const {store, instance} = StoreManager.manager(payload.nodeId);

		this.selectedInspectorNode = {
			nodeId       : payload.nodeId,
			storeBinding : store.getVueBinding()
		};

		payload.state = {
			'1. State'   : this.mapInspectorState(store.getAllState()),
			'2. Getters' : this.mapInspectorGetters({store, instance}, store.getAllGetters()),
			'3. Actions' : this.mapInspectorActions({store, instance}),
		};
	}

	/**
	 * Handle editing inspector values when we edit them via the custom inspector panel
	 *
	 * @param {HookPayloads[Hooks.EDIT_INSPECTOR_STATE]} payload
	 * @param {Context} context
	 * @private
	 */
	private onEditInspectorState(payload: HookPayloads[Hooks.EDIT_INSPECTOR_STATE], context: Context) {
		if (payload.inspectorId !== inspectorId) {
			return;
		}
		if (payload.type !== '1. State') {
			return;
		}

		const {store, instance} = StoreManager.manager(payload.nodeId);

		payload.set(store.getAllState(), payload.path, payload.state?.value);
	}

	/**
	 * Map our main state object into inspector format(this will render the top list like an object in our inspector panel)
	 * @param {{[p: string]: any}} stateData
	 * @returns {(StateBase | Omit<ComponentState, "type">)[]}
	 * @private
	 */
	private mapInspectorState(stateData: { [key: string]: any }): (StateBase | Omit<ComponentState, "type">)[] {
		return Object.entries(stateData).map(([key, data]) => ({
			key,
			editable   : true,
			objectType : 'ref',
			value      : data.value
		}));
	}

	/**
	 * Map our regular `get x():z` getters defined on our store into their own "Getters" list on the inspector panel
	 *
	 * @param {any} store
	 * @param {any} instance
	 * @param {[key: string, descriptor: PropertyDescriptor][]} allGetters
	 * @returns {(StateBase | Omit<ComponentState, "type">)[]}
	 * @private
	 */
	private mapInspectorGetters({store, instance}, allGetters: [key: string, descriptor: PropertyDescriptor][]): (StateBase | Omit<ComponentState, "type">)[] {
		return allGetters.map(([key, descriptor]) => {
			return {
				key,
				editable   : false,
				objectType : 'computed',
				value      : descriptor.get.call(instance)
			};
		});
	}

	/**
	 * Map our actions(store methods) into their own "Actions" list on the inspector panel
	 *
	 * @param {any} instance
	 * @param {any} store
	 * @returns {(StateBase | Omit<ComponentState, "type">)[]}
	 * @private
	 */
	private mapInspectorActions({instance, store},): (StateBase | Omit<ComponentState, "type">)[] {
		return store.getAllActions().map(([key, descriptor]) => {
			const funcNameDescriptor = `${key}(${descriptor.params.map(
				p => p.name + (p.type ? ':' + p.type : '') + (p.defaultValue ? ` = ${p.defaultValue}` : '')
			).join(', ')})`;

			/*const paramValues = descriptor.params.map(p => ({
			 _custom : {
			 key        : p.name,
			 value      : p.defaultValue,
			 editable   : true,
			 id         : key,
			 objectType : 'ref',
			 }
			 }));*/

			return {
				key   : funcNameDescriptor,
				value : {
					_custom : {
						type     : 'function',
						id       : key,
						abstract : true,
						/*value    : !descriptor?.params?.length ? undefined : paramValues,*/
						actions : [
							/**
							 * This will allow us to trigger the method via the inspector panel...
							 * But we have no way to set required params yet :(
							 */
							{
								icon    : 'smart_button',
								tooltip : 'Call Action',
								action  : async (payload: HookPayloads[Hooks.GET_INSPECTOR_STATE], context: Context) => {
									try {
										let result = (instance as any)[key].call(instance);
										if (result instanceof Promise) {
											result = (await result);
										}
										console.log(key + '() => ', result);
									} catch (error) {
										console.log(key + '() => ', error);
									}
								}
							}
						]
					},
				} as CustomState
			};
		});
	}

	/**
	 * When we're viewing a component, if we detect a store, we'll override it's state
	 * in devtools, so it displays like an object directly rather than the whole
	 * class with private methods/properties etc
	 *
	 * @param {HookPayloads[Hooks.INSPECT_COMPONENT]} payload
	 * @param {Context} context
	 * @private
	 */
	private onInspectComponent(payload: HookPayloads[Hooks.INSPECT_COMPONENT], context: Context) {
		for (let stateElement of payload.instanceData.state) {
			if (!(stateElement.value instanceof BaseStore)) {
				continue;
			}

			const {store, instance}        = StoreManager.manager((stateElement.value as any).vueBinding);
			//			stateElement.type              = 'STORE_STATE';
			(stateElement as any).storeRef = instance;
			stateElement.editable          = true;
			stateElement.objectType        = 'reactive';
			stateElement.value             = {
				_custom : {
					//					type  : 'STORE_STATE',
					value : Object.entries(store.getAllState()).reduce((acc, [key, value]) => {
						acc[key] = value;
						return acc;
					}, {})
				}
			};
		}
	}


	private onEditComponentState(payload: HookPayloads[Hooks.EDIT_COMPONENT_STATE], context: Context) {
		//		if (payload.type !== 'STORE_STATE') {
		//			return;
		//		}
		//		payload.set(payload);
		//		console.log('edit', payload);
	}


	public updateStore(baseStore: any) {
		throttle(() => this.api.sendInspectorState(inspectorId), 100)();
	}
}

export default new DevtoolsInstance();
