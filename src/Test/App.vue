<template>
	<div class="max-w-3xl mx-auto py-4 flex flex-col space-y-4">

		<div>
			<p>Object mutations</p>

			<div v-if="$newYeet.banner" class="bg-gray-300 rounded shadow px-4 py-2">
				{{ $newYeet.banner }}
			</div>

			<div>
				<div>
					<p>Mutations:</p>
					<div class="flex flex-row items-center">
						<button @click="$newYeet.setNewMessage('Hello world')">setMessage func</button>
						<button @click="$newYeet.$banner.message = 'hello world #1'">$banner.message</button>
						<button @click="$newYeet.state.banner.message = 'hello world #2'">banner.message</button>
					</div>
				</div>
				<div class="flex flex-row items-center">
					<button @click="$newYeet.removeBanner()">Remove banner</button>
				</div>
			</div>

		</div>

		<div class="flex flex-row items-center space-x-6">
			<button @click="$newYeet.incrementRef()">
				Increment Ref
			</button>

			<button @click="$newYeet.increment()">
				Increment
			</button>

			<button @click="yeetStore.counter++">
				Increment via computed setter
			</button>

			<button
				@click="$newYeet.$patch({counter : $newYeet.$counter + 1, inputValue: 'Testing: '+$newYeet.$counter})"
			>
				Increment via $patch object
			</button>
			<button
				@click="$newYeet.$patch((state) => {state.counter += 1; state.inputValue = 'Testing: '+state.counter;})"
			>
				Increment via $patch fn
			</button>
		</div>

		<div class="flex flex-row items-center space-x-6">

			<button @click="$newYeet.myTestFunc('hello world')">
				Test Func
			</button>

			<button @click="$newYeet.promiseFunc('hello world')">
				Test Promise Func
			</button>

			<button @click="$newYeet.errorFunc()">
				Test Error Func
			</button>

		</div>

		<p>Counter:</p>
		<div class="grid grid-cols-4 gap-6">
			<div>
				<p>Direct state</p>
				{{ $newYeet.state.counter }}
			</div>
			<div>
				<p>$ Ref</p>
				{{ $newYeet.$counter }}
			</div>
			<div>
				<p>Getter</p>
				{{ $newYeet.counter }}
			</div>
			<div>
				<p>Getter Ref</p>
				{{ $newYeet.counterRef }}
			</div>
		</div>


		<p>Input testing</p>

		<div class="grid grid-cols-4 gap-6">
			<div>
				<label>Direct state</label>
				<input type="text" class="border border-gray-400" v-model="$newYeet.state.inputValue">
			</div>
			<div>
				<label>$ Ref</label>
				<input type="text" class="border border-gray-400" v-model="$newYeet.$inputValue">
			</div>
			<div>
				<label>Getter</label>
				<input type="text" class="border border-gray-400" v-model="$newYeet.inputValue">
			</div>
			<div>
				<label>Getter Ref</label>
				<input type="text" class="border border-gray-400" v-model="$newYeet.inputValueRef">
			</div>
		</div>


		<p>Data:</p>

		<div class="grid grid-cols-4 gap-6">
			<div class="overflow-hidden">
				<p>Direct state</p>
				<p class="text-truncate">{{ $newYeet.state.inputValue }}</p>
			</div>
			<div class="overflow-hidden">
				<p>$ Ref</p>
				<p class="text-truncate">{{ $newYeet.$inputValue }}</p>
			</div>
			<div class="overflow-hidden">
				<p>Getter</p>
				<p class="text-truncate">{{ $newYeet.inputValue }}</p>
			</div>
			<div class="overflow-hidden">
				<p>Getter Ref</p>
				<p class="text-truncate">{{ $newYeet.inputValueRef }}</p>
			</div>
		</div>

		<p>Extensions:</p>

		<div class="grid grid-cols-4 gap-6">
			<div class="overflow-hidden">
				<p>Global Func</p>
				<!--				<p class="text-truncate">{{ $newYeet.$inputValue }}</p>-->
				<!--				<p class="text-truncate">{{ $newYeet.someGlobalFunc() }}</p>-->
				<!--				<p class="text-truncate">{{ yeetStore.someGlobalFunc() }}</p>-->
				<!--				<p class="text-truncate">{{ yeetStore.doThing() }}</p>-->
			</div>
			<div class="overflow-hidden">
				<p>someGlobalVar</p>
				<!--				<p class="text-truncate">{{ $newYeet.someGlobalVar }}</p>-->
				<!--				<p class="text-truncate">{{ yeetStore.someGlobalVar }}</p>-->
			</div>
		</div>

	</div>
</template>

<script setup lang="ts">
import {yeetStore} from './Stores/YeetStore';



/*yeetStore.someGlobalFunc();*/

/*yeetStore.$onAction(({store, args, name, before, error, after}) => {
 const startTime = Date.now();
 console.log(`Start "${name}" with args [${args.join(', ')}].`);

 before(payload => {
 console.log(`Before "${name}" args`, payload);
 // return some new args to use instead
 return payload;
 });

 after((result) => {
 console.log(
 `Finished "${name}" after ${Date.now() - startTime}ms.\nResult: ${result}.`
 );
 });

 error((error) => {
 console.warn(
 `Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`
 );
 });
 });*/

</script>

