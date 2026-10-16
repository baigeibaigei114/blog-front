import { defineStore } from 'pinia'
import { ref } from 'vue'
import { publicApi } from '../api'
export const usePostStore = defineStore('posts', () => {
  const page = ref(null)
  async function fetchPosts(params, signal) {
    const result = await publicApi.posts(params, signal)
    if (!signal?.aborted) page.value = result
    return result
  }
  return { page, fetchPosts }
})
