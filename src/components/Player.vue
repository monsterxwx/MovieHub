<!-- src/components/Player.vue -->
<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  }
})

const artRef = ref(null)
let instance = null

// 初始化播放器
const initArtplayer = () => {
  if (!props.url) return

  // 销毁旧实例
  if (instance) {
    instance.destroy(false)
  }

  instance = new Artplayer({
    container: artRef.value,
    url: props.url,
    poster: props.poster,
    volume: 0.5,
    isLive: false,
    muted: false,
    autoplay: false,
    pip: true, // 画中画
    autoSize: true,
    autoMini: true,
    screenshot: true, // 截图功能
    setting: true, // 设置面板
    loop: false,
    flip: true, // 画面翻转
    playbackRate: true, // 倍速播放
    aspectRatio: true, // 画面比例
    fullscreen: true, // 全屏
    fullscreenWeb: true, // 网页全屏
    subtitleOffset: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    airplay: true,
    theme: '#9333ea', // 播放器主题色 (紫色，配合你的网站主题)

    // 核心：集成 hls.js 以支持 m3u8
    customType: {
      m3u8: function (video, url, art) {
        if (Hls.isSupported()) {
          if (art.hls) art.hls.destroy()
          const hls = new Hls()
          hls.loadSource(url)
          hls.attachMedia(video)
          art.hls = hls
          art.on('destroy', () => hls.destroy())
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
        } else {
          art.notice.show = '不支持播放格式：m3u8'
        }
      }
    }
  })
}

onMounted(() => {
  nextTick(() => {
    initArtplayer()
  })
})

// 监听 URL 变化（比如切换集数时）
watch(() => props.url, (newUrl) => {
  if (instance && newUrl) {
    instance.switchUrl(newUrl)
    // 切换后自动播放
    instance.play()
  }
})

onBeforeUnmount(() => {
  if (instance && instance.destroy) {
    instance.destroy(false)
  }
})
</script>

<template>
  <div ref="artRef" class="artplayer-app" />
</template>

<style scoped>
.artplayer-app {
  width: 100%;
  height: 100%;
}
</style>
