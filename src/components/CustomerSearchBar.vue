<template>
  <div class="bg-white rounded-xl p-3 border border-gray-100 mb-3 flex flex-wrap items-center gap-3">
    <el-select v-model="selectedCustomer" :placeholder="t('searchBar.selectCustomer')" style="width: 200px" size="default"
      filterable :filter-method="filterCustomers" @change="handleCustomerChange">
      <el-option v-for="c in customerList" :key="c.id" :label="c.name + ' (' + c.id + ')'" :value="c.id" />
    </el-select>
    <el-input
      v-model="searchText"
      :placeholder="t('searchBar.placeholder')"
      :prefix-icon="Search"
      style="width: 260px"
      clearable
      @keyup.enter="handleEnter"
      @clear="handleClear"
    />
    <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
    <div class="ml-auto text-xs text-gray-400 flex items-center gap-1.5">
      <el-icon><InfoFilled /></el-icon>
      {{ t('searchBar.currentTip') }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, InfoFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { getCustomerList } from '../api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const customerList = ref([])
const selectedCustomer = ref('')
const searchText = ref('')

async function fetchList(keyword) {
  const data = await getCustomerList(keyword)
  customerList.value = data
}

function filterCustomers(val) {
  fetchList(val || undefined)
}

function navigateTo(id, name) {
  if (!id) return
  router.push({ query: { id, name: name || '' } })
}

function handleCustomerChange(val) {
  const c = customerList.value.find(item => item.id === val)
  navigateTo(val, c?.name)
}

function handleSearch() {
  fetchList(searchText.value || undefined).then(() => {
    if (customerList.value.length) {
      const first = customerList.value[0]
      selectedCustomer.value = first.id
      navigateTo(first.id, first.name)
    }
  })
}

function handleEnter() {
  fetchList(searchText.value || undefined).then(() => {
    if (customerList.value.length) {
      const first = customerList.value[0]
      selectedCustomer.value = first.id
      navigateTo(first.id, first.name)
    }
  })
}

function handleClear() {
  searchText.value = ''
  fetchList().then(() => {
    if (customerList.value.length) {
      const first = customerList.value[0]
      selectedCustomer.value = first.id
      navigateTo(first.id, first.name)
    }
  })
}

watch(() => route.query.id, (val) => {
  if (val && val !== selectedCustomer.value) {
    selectedCustomer.value = val
  }
}, { immediate: true })

onMounted(async () => {
  await fetchList()
  const qId = route.query.id
  if (qId) {
    selectedCustomer.value = qId
  } else if (customerList.value.length) {
    const first = customerList.value[0]
    selectedCustomer.value = first.id
    navigateTo(first.id, first.name)
  }
})
</script>
