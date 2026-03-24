<script setup>
// 关于页静态数据
const socials = [
  { name: 'GitHub', url: 'https://github.com/q1724588603-hue/myblog', icon: 'github' },
  { name: 'Bilibili', url: 'https://space.bilibili.com/426868443', icon: 'bilibili' }
]

const learning = {
  icon: '📚',
  title: '正在学习',
  content: 'Spring cloud 微服务'
}
</script>

<template>
  <div class="about-page">
    <!-- 返回首页按钮 -->
    <router-link to="/" class="back-home-btn" title="返回首页">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </router-link>

    <main class="main">
      <div class="content">
        <div class="container">
          <!-- Hero 区域 -->
          <div class="about-hero">
            <div class="about-avatar">
              <img src="/images/avatar.jpg" alt="头像">
            </div>
            <div class="about-intro">
              <h1>hi, I'm baigeibaigei114</h1>
              <p class="about-bio">
                大二在校生，本博客主要用于记录学习笔记
              </p>
              <div class="about-social">
                <a
                  v-for="social in socials"
                  :key="social.name"
                  :href="social.url"
                  class="social-link"
                  target="_blank"
                  :title="social.name"
                >
                  <svg v-if="social.icon === 'github'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <svg v-else-if="social.icon === 'bilibili'" width="20" height="20" viewBox="0 0 24 24">
                    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" fill="currentColor"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <!-- 正在学习 -->
          <section class="about-section">
            <div class="learning-card">
              <div class="learning-icon">{{ learning.icon }}</div>
              <div class="learning-content">
                <h3 class="learning-title">{{ learning.title }}</h3>
                <p class="learning-text">{{ learning.content }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container-wide">
        <div class="footer-content">
          <div class="footer-links">
            <a href="https://github.com/q1724588603-hue/myblog" class="footer-link" target="_blank">GitHub</a>
            <a href="https://space.bilibili.com/426868443" class="footer-link" target="_blank">Bilibili</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100vh;
}

.back-home-btn {
  position: fixed;
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(22, 27, 34, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all var(--transition-fast);
}

.back-home-btn:hover {
  background-color: var(--color-accent);
  color: white;
  transform: translateX(-3px);
  text-decoration: none;
}

.about-hero {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
  padding: var(--spacing-2xl) 0;
  border-bottom: 1px solid var(--border-muted);
  margin-bottom: var(--spacing-2xl);
}

.about-avatar {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.about-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about-intro h1 {
  font-size: var(--text-4xl);
  margin-bottom: var(--spacing-sm);
}

.about-bio {
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.about-social {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.social-link:hover {
  background-color: var(--color-accent);
  color: white;
  text-decoration: none;
  transform: translateY(-2px);
}

.about-section {
  margin-bottom: var(--spacing-2xl);
}

.learning-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: rgba(22, 27, 34, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.learning-icon {
  font-size: 28px;
}

.learning-title {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.learning-text {
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

@media (max-width: 768px) {
  .about-hero {
    flex-direction: column;
    text-align: center;
  }

  .about-social {
    justify-content: center;
  }

  .about-avatar {
    width: 150px;
    height: 150px;
  }
}
</style>