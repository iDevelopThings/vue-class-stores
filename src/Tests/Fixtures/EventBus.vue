<template>

</template>

<script setup lang="ts">

import storeManager from "../../Lib/StoreManager";
import {store} from "../EventBus.spec";

store.$on('some_other_event', (payload) => {
	console.log(payload);
});

storeManager.bus.$on('some_other_event', (payload) => {
	console.log(payload);
});

</script>

