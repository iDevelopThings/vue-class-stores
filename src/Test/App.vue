<template>
	<div class="max-w-3xl mx-auto py-4 flex flex-col space-y-4">
		<div class="flex flex-row items-center space-x-6">
			<button class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2" @click="$newYeet.incrementRef()">
				Increment Ref
			</button>

			<button class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2" @click="$newYeet.increment()">
				Increment
			</button>
			<button class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2" @click="yeetStore.increment()">
				Increment Imported
			</button>
			<button
				class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2"
				@click="$newYeet.$patch({counter : $newYeet.$counter + 1, inputValue: 'Testing: '+$newYeet.$counter})"
			>
				Increment via $patch object
			</button>
			<button
				class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2"
				@click="$newYeet.$patch((state) => {state.counter += 1; state.inputValue = 'Testing: '+state.counter;})"
			>
				Increment via $patch fn
			</button>
		</div>

		<div class="flex flex-row items-center space-x-6">

			<button class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2" @click="$newYeet.myTestFunc('hello world')">
				Test Func
			</button>

			<button class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2" @click="$newYeet.promiseFunc('hello world')">
				Test Promise Func
			</button>

			<button class="rounded shadow bg-gray-200 hover:bg-gray-300 px-4 py-2" @click="$newYeet.errorFunc('hello world')">
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
				<p class="text-truncate">{{ $newYeet.$inputValue }}</p>
				<p class="text-truncate">{{ $newYeet.someGlobalFunc() }}</p>
				<p class="text-truncate">{{ yeetStore.someGlobalFunc() }}</p>
				<p class="text-truncate">{{ yeetStore.doThing() }}</p>
			</div>
			<div class="overflow-hidden">
				<p>someGlobalVar</p>
				<p class="text-truncate">{{ $newYeet.someGlobalVar }}</p>
				<p class="text-truncate">{{ yeetStore.someGlobalVar }}</p>
			</div>
		</div>

	</div>
</template>

<script setup lang="ts">
import {yeetStore} from './Stores/YeetStore';

console.log(yeetStore);

yeetStore.someGlobalFunc();


yeetStore.$onAction(({store, args, name, before, error, after}) => {

	before(payload => {
		console.log(`[${name}]: before`, payload);
		return payload;
	});

	error((error) => {
		console.log(`[${name}]: error`, error);
	});

	after((result) => {
		console.log(`[${name}]: after`, result);
	});

});

</script>

