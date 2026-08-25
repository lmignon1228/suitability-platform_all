<template>
  <div class="login-page flex h-screen overflow-hidden">
    <!-- Left: Tech Background -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#003EB3] via-[#0052D9] to-[#165DFF] items-center justify-center overflow-hidden">
      <!-- Decorative circles -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div v-for="i in 15" :key="i" class="absolute rounded-full bg-white/[0.06]"
          :style="{
            width: (Math.abs(Math.sin(i * 1.7)) * 250 + 60) + 'px',
            height: (Math.abs(Math.sin(i * 1.7)) * 250 + 60) + 'px',
            top: (Math.abs(Math.cos(i * 2.1)) * 80 + 5) + '%',
            left: (Math.abs(Math.sin(i * 1.3)) * 80 + 5) + '%',
          }" />
      </div>
      <!-- Grid pattern -->
      <div class="absolute inset-0 opacity-[0.04]"
        style="background-image: linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 40px 40px;" />

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center text-center px-10 max-w-lg">
        <div class="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-8">
          <el-icon :size="40" color="#fff"><Promotion /></el-icon>
        </div>
        <h1 class="text-4xl font-extrabold text-white tracking-wide mb-4 leading-tight">用户适当性管理平台</h1>
        <p class="text-lg text-white/70 mb-10 leading-relaxed">
          基于多维度数据模型，为每位客户提供精准的适当性评估与风险管理服务
        </p>
        <div class="grid grid-cols-1 gap-4 w-full max-w-sm">
          <div v-for="(feature, idx) in features" :key="idx"
            class="flex items-center gap-3 bg-white/[0.08] backdrop-blur-sm rounded-xl px-4 py-3">
            <div class="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <el-icon :size="18" color="#fff"><component :is="feature.icon" /></el-icon>
            </div>
            <span class="text-white/85 text-sm">{{ feature.text }}</span>
          </div>
        </div>
      </div>

      <div class="absolute bottom-6 text-white/30 text-xs">© 2024 用户适当性管理平台 v3.0</div>
    </div>

    <!-- Right: Login Card -->
    <div class="w-full lg:w-1/2 flex items-center justify-center bg-white px-8">
      <div class="w-[400px]">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center justify-center gap-2.5 mb-10">
          <div class="w-10 h-10 bg-[#0052D9] rounded-xl flex items-center justify-center">
            <el-icon :size="22" color="#fff"><Promotion /></el-icon>
          </div>
          <span class="text-xl font-bold text-[#0052D9]">适当性管理平台</span>
        </div>

        <h2 class="text-xl font-bold text-gray-800 mb-1.5">欢迎登录</h2>
        <p class="text-sm text-gray-400 mb-8">请输入您的账号信息以访问系统</p>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0" size="large">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item prop="captcha">
            <div class="flex gap-3 w-full">
              <el-input v-model="loginForm.captcha" placeholder="请输入验证码" :prefix-icon="Key" class="flex-1" />
              <div class="h-[42px] w-[130px] flex-shrink-0 cursor-pointer rounded overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center hover:border-[#0052D9]/40 transition-colors"
                @click="refreshCaptcha">
                <canvas ref="captchaCanvas" width="130" height="42" />
              </div>
            </div>
          </el-form-item>
          <el-form-item>
            <div class="flex justify-between items-center w-full">
              <el-checkbox v-model="rememberUsername">记住用户名</el-checkbox>
              <a href="javascript:;" class="text-sm text-[#0052D9] hover:text-[#003EB3]">忘记密码？</a>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="w-full !h-11 !text-base !font-semibold !rounded-lg" @click="handleLogin">
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <!-- Divider -->
        <div class="relative my-7">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200" /></div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-white text-gray-400">其他登录方式</span>
          </div>
        </div>

        <!-- SSO buttons -->
        <div class="flex justify-center gap-8">
          <button class="flex flex-col items-center gap-1.5 group">
            <div class="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#0052D9]/50 group-hover:bg-[#0052D9]/5 transition-all">
              <el-icon :size="20" class="text-gray-400 group-hover:text-[#0052D9] transition-colors"><Connection /></el-icon>
            </div>
            <span class="text-xs text-gray-400">SSO单点登录</span>
          </button>
          <button class="flex flex-col items-center gap-1.5 group">
            <div class="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#0052D9]/50 group-hover:bg-[#0052D9]/5 transition-all">
              <el-icon :size="20" class="text-gray-400 group-hover:text-[#0052D9] transition-colors"><OfficeBuilding /></el-icon>
            </div>
            <span class="text-xs text-gray-400">企业登录</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Key, Connection, OfficeBuilding, Promotion, DataAnalysis, Monitor, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loginFormRef = ref(null)
const captchaCanvas = ref(null)
const rememberUsername = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456',
  captcha: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: []
}

const features = [
  { icon: markRaw(DataAnalysis), text: '多维度风险评估模型，实时跟踪客户风险变化' },
  { icon: markRaw(Monitor), text: '智能异常行为监测，提前预警潜在风险' },
  { icon: markRaw(CircleCheck), text: '合规管理全流程覆盖，满足监管要求' },
]

function drawCaptcha() {
  const canvas = captchaCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhjkmnprstwxyz2345678'
  let code = ''
  ctx.fillStyle = '#f9fafb'
  ctx.fillRect(0, 0, 130, 42)
  for (let i = 0; i < 4; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)]
    code += char
    ctx.font = `bold ${Math.random() * 3 + 18}px monospace`
    ctx.fillStyle = `rgb(${Math.random() * 80 + 60}, ${Math.random() * 80 + 60}, ${Math.random() * 80 + 120})`
    ctx.textBaseline = 'middle'
    ctx.save()
    ctx.translate(20 + i * 28, 21)
    ctx.rotate((Math.random() - 0.5) * 0.35)
    ctx.fillText(char, 0, 0)
    ctx.restore()
  }
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200}, 0.4)`
    ctx.beginPath()
    ctx.arc(Math.random() * 130, Math.random() * 42, 1, 0, Math.PI * 2)
    ctx.fill()
  }
}

function refreshCaptcha() {
  drawCaptcha()
}

function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (valid) {
      sessionStorage.setItem('token', 'mock-token')
      ElMessage.success('登录成功')
      router.push('/dashboard')
    }
  })
}

onMounted(() => {
  drawCaptcha()
})
</script>

<style scoped>
.login-page {
  background: #fff;
}
</style>
