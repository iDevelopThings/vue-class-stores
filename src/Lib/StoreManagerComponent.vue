<template>

</template>

<script setup lang="ts">
/**
 * This component is mainly a place holder to be used with @vue/test-utils mount method
 */

import {onUnmounted} from "vue";
import StoreManager from "./StoreManager";

onUnmounted(() => {
	StoreManager.__scope.stop();
});
</script>

