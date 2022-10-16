<template>
	<div v-if="$todos.isLoading"><p>Loading your todos!</p></div>
	<div v-else>
		<div v-for="todo in $todos.todos">
			<p>{{ todo.title }}</p>
			<p>Is complete? {{ todo.completed }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import {todosStore} from "./Stores/TodoStore";
todosStore.load();
</script>

