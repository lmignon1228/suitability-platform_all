<template>
  <div class="bg-white rounded-xl p-3 border border-gray-100 mb-3 flex flex-wrap items-center gap-3">
    <el-select v-model="selectedCustomer" placeholder="选择客户" style="width: 200px" size="default"
      @change="handleCustomerChange">
      <el-option v-for="c in customerList" :key="c.id" :label="c.name + ' (' + c.id + ')'" :value="c.id" />
    </el-select>
    <el-input
      v-model="searchText"
      placeholder="搜索姓名/ID/手机号"
      :prefix-icon="Search"
      style="width: 260px"
      clearable
    />
    <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
    <div class="ml-auto text-xs text-gray-400 flex items-center gap-1.5">
      <el-icon><InfoFilled /></el-icon>
      本页按当前客户展示
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Search, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  initialCustomerId: { type: String, default: '' },
  initialCustomerName: { type: String, default: '' }
})

const emit = defineEmits(['customer-change'])

const customerList = [
  { id: 'C00012857', name: '张景豪' },
  { id: 'C00012858', name: '王建国' },
  { id: 'C00012859', name: '赵思远' },
  { id: 'C00012860', name: '陈晓明' },
  { id: 'C00008231', name: '张三' },
  { id: 'C00008232', name: '李四' },
]

const selectedCustomer = ref(props.initialCustomerId || 'C00008231')
const searchText = ref('')

watch(() => props.initialCustomerId, (val) => {
  if (val) selectedCustomer.value = val
})

function handleCustomerChange(val) {
  const c = customerList.find(item => item.id === val)
  emit('customer-change', { id: val, name: c?.name || '' })
}

function handleSearch() {
  // Mock search
}
</script>
