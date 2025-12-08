<script setup>
import { useRoute, useRouter } from 'vue-router'
import { Search, Clapperboard, Menu, X } from 'lucide-vue-next' // 引入 Menu 和 X 图标
import { ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()

// 状态：移动端菜单是否打开
const isMobileMenuOpen = ref(false)
const searchKeyword = ref('')

// 切换移动端菜单
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// 搜索逻辑
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return
  router.push({ path: '/search', query: { q: searchKeyword.value } })
  isMobileMenuOpen.value = false // 搜索后关闭菜单
}

// 菜单配置
const menuItems = [
  { name: '首页', path: '/home' },
  { name: '电影', path: '/category/1', key: '1' },
  { name: '剧集', path: '/category/2', key: '2' },
  { name: '综艺', path: '/category/3', key: '3' },
  { name: '动漫', path: '/category/4', key: '4' }
]

const gobackHome = () => {
  router.push('/')
  isMobileMenuOpen.value = false
}

const emit = defineEmits(['change'])

const changeType = (path) => {
  emit('change', path)
  isMobileMenuOpen.value = false // 点击链接后关闭菜单
}

// 判断激活状态
const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// 监听路由变化，自动关闭移动端菜单（防止跳转后菜单还开着）
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0f1014]/80 backdrop-blur-xl transition-all duration-300">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- 1. Logo -->
      <div @click="gobackHome" class="flex items-center gap-2 cursor-pointer group z-50">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110">
          <Clapperboard class="h-5 w-5 text-white" />
        </div>
        <span class="text-xl font-bold tracking-tight text-white group-hover:text-purple-100 transition-colors">
          Movie<span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Hub</span>
        </span>
      </div>

      <!-- 2. PC端 菜单 (大屏显示) -->
      <div class="hidden md:flex items-center gap-2">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          @click="changeType(item.key || '')"
          class="relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full group"
          :class="isActive(item.path) ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'"
        >
          {{ item.name }}
          <!-- 选中/Hover 效果 -->
          <span v-if="isActive(item.path)" class="absolute bottom-0 left-20% border-rd-8px h-1 right-20%  bg-purple-500 shadow-[0_0_8px_2px_rgba(168,85,247,0.8)]" />
          <span v-else class="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </router-link>
      </div>

      <!-- 3. PC端 右侧工具 (搜索框) -->
      <div class="hidden md:flex items-center gap-4">
        <div class="relative group">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-purple-400" />
          <input
            v-model="searchKeyword"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="搜索影片..."
            class="h-9 w-64 rounded-full border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-gray-200 transition-all duration-300 focus:w-72 focus:border-purple-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder-gray-600"
          >
        </div>
      </div>

      <!-- 4. 移动端 汉堡菜单按钮 (小屏显示) -->
      <div class="flex md:hidden items-center">
        <button
          @click="toggleMobileMenu"
          class="group relative flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white hover:border-purple-500/30 active:scale-95"
          :class="isMobileMenuOpen ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : ''"
        >
          <!-- 图标容器，为了加动画 -->
          <div class="relative w-6 h-6">
            <!-- 关闭图标 (当菜单打开时显示) -->
            <X
              class="absolute inset-0 w-6 h-6 transition-all duration-300 transform"
              :class="isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'"
            />

            <!-- 菜单图标 (当菜单关闭时显示) -->
            <Menu
              class="absolute inset-0 w-6 h-6 transition-all duration-300 transform"
              :class="isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'"
            />
          </div>
        </button>
      </div>
    </div>

    <!-- 5. 移动端 下拉菜单面板 -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-show="isMobileMenuOpen"
        class="md:hidden absolute top-16 left-0 right-0 bg-[#0f1014]/95 backdrop-blur-xl border-b border-white/5 px-4 py-6 shadow-2xl flex flex-col gap-6"
      >
        <!-- 移动端搜索框 -->
        <div class="relative">
          <Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            v-model="searchKeyword"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="搜索影片..."
            class="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 text-base text-white focus:border-purple-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
        </div>

        <!-- 移动端导航链接 -->
        <div class="flex flex-col space-y-2">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            @click="changeType(item.key || '')"
            class="flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all"
            :class="isActive(item.path)
              ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'"
          >
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </transition>
  </nav>
</template>
