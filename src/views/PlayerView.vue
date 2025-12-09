<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import Hls from 'hls.js'
import { Calendar, MapPin, User, FileText, Layers } from 'lucide-vue-next'
import Player from '@/components/Player.vue'

// --- 状态定义 ---
const route = useRoute()
const videoDetail = ref(null) // 存储接口返回的原始数据
const playSources = ref([]) // 解析后的播放源数据结构
const currentSourceIndex = ref(0) // 当前选中的播放源 (Tab索引)
const currentEpisodeUrl = ref('') // 当前播放的URL
const currentEpisodeName = ref('') // 当前播放的集数名称
const videoPlayer = ref(null) // video DOM 引用
let hls = null // Hls.js 实例

// --- 核心逻辑 1: 获取并解析数据 ---
const fetchVideoDetail = async () => {
  const res = await fetch(`/api/proxy?ac=detail&ids=${route.params.id}`)
  const data = await res.json()
  videoDetail.value = data?.list[0] || {}
  await nextTick()
  parsePlayUrl(videoDetail.value.vod_play_from, videoDetail.value.vod_play_url)
}

// --- 核心逻辑 2: 解析播放地址字符串 ---
const parsePlayUrl = (playFrom, playUrl) => {
  // 处理空值情况
  if (!playFrom || !playUrl) {
    playSources.value = []
    return
  }

  // 1. 分割源名称，如果没有$$$分隔符则作为单个源处理
  const sourceNames = playFrom.includes('$$$') ? playFrom.split('$$$') : [playFrom]
  // 2. 分割源数据，如果没有$$$分隔符则作为单个源数据
  const sourceData = playUrl.includes('$$$') ? playUrl.split('$$$') : [playUrl]

  const result = sourceNames.map((name, index) => {
    const rawEpisodes = sourceData[index] || '' // 防止数组越界

    // 3. 分割集数，如果没有#分隔符则作为单集处理
    let episodes = []

    if (rawEpisodes.includes('#')) {
      // 正常多集情况
      episodes = rawEpisodes.split('#').map((epStr) => {
        if (epStr.includes('$')) {
          // 正常的 "第01集$URL" 格式
          const [epName, epUrl] = epStr.split('$')
          return { name: epName, url: epUrl }
        } else {
          // 只有URL，没有集数名稱，使用默认名称
          return { name: `第${episodes.length + 1}集`, url: epStr }
        }
      })
    } else {
      // 单集情况
      if (rawEpisodes.includes('$')) {
        // "第01集$URL" 格式
        const [epName, epUrl] = rawEpisodes.split('$')
        episodes = [{ name: epName, url: epUrl }]
      } else {
        // 只有URL，使用默认名称
        episodes = [{ name: '正片', url: rawEpisodes }]
      }
    }

    return {
      name, // 源名称
      episodes // 该源下的集数列表
    }
  })

  playSources.value = result

  // 默认自动播放：第一个源的第一集
  if (result.length > 0 && result[0].episodes.length > 0) {
    playEpisode(result[0].episodes[0].url, result[0].episodes[0].name)
  }
}

// --- 核心逻辑 3: 切换集数与 HLS 播放 ---
const playEpisode = (url, name) => {
  currentEpisodeUrl.value = url
  currentEpisodeName.value = name

  if (Hls.isSupported()) {
    if (hls) hls.destroy() // 切换前销毁旧实例
    hls = new Hls()
    hls.loadSource(url)
    hls.attachMedia(videoPlayer.value)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoPlayer.value.play()
    })
  } else if (videoPlayer.value.canPlayType('application/vnd.apple.mpegurl')) {
    // 兼容 Safari
    videoPlayer.value.src = url
    videoPlayer.value.play()
  }
}

// 计算属性：获取当前选中的源下面的集数列表
const currentEpisodesList = computed(() => {
  if (!playSources.value.length) return []
  return playSources.value[currentSourceIndex.value].episodes
})

onMounted(() => {
  fetchVideoDetail()
})

onBeforeUnmount(() => {
  if (hls) hls.destroy()
})
</script>

<template>
  <div class="min-h-screen bg-[#0f1014] text-gray-100 font-sans pb-10">
    <NavBar />

    <!-- 只有数据加载完成后才显示 -->
    <div v-if="videoDetail" class="pt-20 mx-auto max-w-7xl px-4 lg:px-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
      <!-- 左侧主区域：播放器 + 信息 -->
      <div class="flex-1 min-w-0">
        <!-- 播放器容器 -->
        <div class="relative aspect-video w-full overflow-hidden rounded-xl  shadow-2xl shadow-purple-900/10 border border-white/5 group">
          <Player
            v-if="currentEpisodeUrl"
            :url="currentEpisodeUrl"
            :poster="videoDetail?.vod_pic"
          />

          <!-- 如果没有 URL (比如刚加载时)，显示封面 -->
          <div v-else class="w-full h-full flex items-center justify-center bg-black">
            <img :src="videoDetail?.vod_pic" class="w-full h-full object-cover opacity-50">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>

        <!-- 播放源切换 (如果有多个源) -->
        <div v-if="playSources.length > 1" class="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            v-for="(source, index) in playSources"
            :key="index"
            @click="currentSourceIndex = index"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 border"
            :class="currentSourceIndex === index
              ? 'bg-purple-600 border-purple-500 text-white'
              : 'bg-[#1a1b21] border-transparent text-gray-400 hover:text-white hover:bg-[#25262c]'"
          >
            <Layers class="w-4 h-4" />
            {{ source.name }}
          </button>
        </div>

        <!-- 影片基础信息 -->
        <div class="mt-6 space-y-4">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
              {{ videoDetail.vod_name }}
            </h1>
            <div class="flex items-center gap-2 text-sm">
              <span class="text-purple-400 font-medium">正在播放:</span>
              <span class="text-gray-200">{{ currentEpisodeName }}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <span class="flex items-center gap-1"><Calendar class="w-4 h-4" /> {{ videoDetail.vod_year }}</span>
            <span class="flex items-center gap-1"><MapPin class="w-4 h-4" /> {{ videoDetail.vod_area }}</span>
            <span class="flex items-center gap-1"><User class="w-4 h-4" /> {{ videoDetail.vod_actor }}</span>
          </div>

          <!-- 简介 -->
          <div class="p-5 rounded-xl bg-[#1a1b21] border border-white/5">
            <h3 class="flex items-center gap-2 font-bold text-white mb-3 text-sm uppercase tracking-wider">
              <FileText class="w-4 h-4 text-purple-500" /> 剧情简介
            </h3>
            <div
              class="text-gray-400 text-sm leading-relaxed"
              v-html="videoDetail.vod_content"
            />
          </div>
        </div>
      </div>

      <!-- 右侧侧边栏：选集 -->
      <div class="w-full lg:w-80 flex-shrink-0">
        <div class="rounded-xl bg-[#1a1b21] border border-white/5 sticky top-24 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
          <!-- 侧边栏头部 -->
          <div class="p-4 border-b border-white/5 bg-[#23242a]">
            <h3 class="font-bold text-white flex justify-between items-center">
              <span>选集</span>
              <span class="text-xs font-normal text-gray-500 bg-black/30 px-2 py-1 rounded-md">
                {{ currentEpisodesList.length }} 集全
              </span>
            </h3>
          </div>

          <!-- 选集列表 (滚动区域) -->
          <div class="p-3 overflow-y-auto flex-1 ">
            <div class="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2">
              <button
                v-for="(ep, index) in currentEpisodesList"
                :key="index"
                @click="playEpisode(ep.url, ep.name)"
                class="relative py-2 px-1 rounded-md text-xs font-medium transition-all duration-200 border truncate"
                :class="currentEpisodeUrl === ep.url
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-[#2a2b32] border-transparent text-gray-400 hover:bg-[#34353c] hover:text-gray-200'"
                :title="ep.name"
              >
                {{ ep.name }}
                <!-- 播放状态小动画 -->
                <span v-if="currentEpisodeUrl === ep.url" class="absolute top-1 right-1 block w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中占位符 -->
    <div v-else class="flex h-screen w-full items-center justify-center">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
    </div>
  </div>
</template>

<style scoped>

</style>
