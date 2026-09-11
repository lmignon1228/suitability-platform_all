import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'suitability-customer-id'

export const useCustomerStore = defineStore('customer', () => {
  const currentCustomerId = ref(localStorage.getItem(STORAGE_KEY) || '')

  watch(currentCustomerId, (val) => {
    if (val) localStorage.setItem(STORAGE_KEY, val)
    else localStorage.removeItem(STORAGE_KEY)
  }, { immediate: true })

  function setCustomer(id) {
    currentCustomerId.value = id || ''
  }

  return { currentCustomerId, setCustomer }
})
