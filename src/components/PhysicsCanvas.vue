<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 技术栈数据
const techStackData = [
  { name: 'Python', icon: 'images/icons/python.svg', color: '#3B82F6' },
  { name: 'Java', icon: 'images/icons/java.svg', color: '#60A5FA' },
  { name: 'Spring', icon: 'images/icons/spring.svg', color: '#34D399' },
  { name: 'Docker', icon: 'images/icons/docker.svg', color: '#06B6D4' },
  { name: 'Linux', icon: 'images/icons/linux.svg', color: '#8B5CF6' },
  { name: 'Vue', icon: 'images/icons/vuejs.svg', color: '#10B981' },
  { name: 'MySQL', icon: 'images/icons/mysql.svg', color: '#0EA5E9' },
  { name: 'PostgreSQL', icon: 'images/icons/postgresql.svg', color: '#6366F1' },
  { name: 'Git', icon: 'images/icons/git.svg', color: '#F97316' },
  { name: 'Redis', icon: 'images/icons/redis.svg', color: '#EC4899' },
  { name: 'Nginx', icon: 'images/icons/nginx.svg', color: '#14B8A6' }
]

const canvasRef = ref(null)
let ctx = null
let animationId = null
let balls = []
let draggedBall = null
let mousePos = { x: 0, y: 0 }
let lastMousePos = { x: 0, y: 0 }
let isDragging = false
let width = 0
let height = 0

const friction = 0.995
const bounce = 0.85
const uniformRadius = 50

// 加载的图标
const iconImages = {}

// 加载图标
function loadIcons() {
  return Promise.all(
    techStackData.map(tech => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          iconImages[tech.name] = img
          resolve()
        }
        img.onerror = () => resolve()
        img.src = tech.icon
      })
    })
  )
}

// 创建球
function createBalls() {
  balls = []
  const margin = 80

  techStackData.forEach((tech, index) => {
    let x, y
    const side = index % 4
    const randomOffset = Math.random() * 0.6 + 0.2

    switch (side) {
      case 0:
        x = margin + Math.random() * (width * 0.2)
        y = height * randomOffset
        break
      case 1:
        x = width - margin - Math.random() * (width * 0.2)
        y = height * randomOffset
        break
      case 2:
        x = width * randomOffset
        y = margin + Math.random() * (height * 0.25)
        break
      case 3:
        x = width * randomOffset
        y = height - margin - Math.random() * (height * 0.25)
        break
    }

    const angle = Math.random() * Math.PI * 2
    const speed = 0.5 + Math.random() * 1

    balls.push({
      x,
      y,
      radius: uniformRadius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      tech,
      isDragging: false,
      glowIntensity: 0
    })
  })
}

// 颜色转换
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 绘制球
function drawBall(ball) {
  ctx.save()

  const isHovered = isBallHovered(ball)
  ball.glowIntensity += ((isHovered ? 1 : 0) - ball.glowIntensity) * 0.15

  if (ball.glowIntensity > 0.01 || ball.isDragging) {
    ctx.shadowColor = ball.tech.color
    ctx.shadowBlur = 30 * Math.max(ball.glowIntensity, ball.isDragging ? 1 : 0)
  }

  const gradient = ctx.createRadialGradient(
    ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
    ball.x, ball.y, ball.radius
  )
  gradient.addColorStop(0, hexToRgba(ball.tech.color, 0.5))
  gradient.addColorStop(0.5, hexToRgba(ball.tech.color, 0.3))
  gradient.addColorStop(1, hexToRgba(ball.tech.color, 0.1))

  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = hexToRgba(ball.tech.color, 0.6)
  ctx.lineWidth = 2
  ctx.stroke()

  // 绘制图标
  const iconImg = iconImages[ball.tech.name]
  if (iconImg) {
    const iconSize = ball.radius * 0.9
    ctx.drawImage(iconImg, ball.x - iconSize / 2, ball.y - iconSize / 2, iconSize, iconSize)
  }

  // 悬停显示名称
  if (isHovered || ball.isDragging) {
    ctx.font = 'bold 14px -apple-system, sans-serif'
    const textWidth = ctx.measureText(ball.tech.name).width
    const bgWidth = textWidth + 20
    const bgX = ball.x - bgWidth / 2
    const bgY = ball.y + ball.radius + 8

    ctx.fillStyle = hexToRgba(ball.tech.color, 0.9)
    ctx.beginPath()
    ctx.roundRect(bgX, bgY, bgWidth, 24, 6)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(ball.tech.name, ball.x, bgY + 16)
    ctx.textAlign = 'left'
  }

  ctx.restore()
}

function isBallHovered(ball) {
  const dx = mousePos.x - ball.x
  const dy = mousePos.y - ball.y
  return Math.sqrt(dx * dx + dy * dy) < ball.radius
}

// 墙壁碰撞
function handleWallCollision(ball) {
  const margin = 5
  if (ball.x - ball.radius < margin) {
    ball.x = margin + ball.radius
    ball.vx *= -bounce
  } else if (ball.x + ball.radius > width - margin) {
    ball.x = width - margin - ball.radius
    ball.vx *= -bounce
  }
  if (ball.y - ball.radius < margin) {
    ball.y = margin + ball.radius
    ball.vy *= -bounce
  } else if (ball.y + ball.radius > height - margin) {
    ball.y = height - margin - ball.radius
    ball.vy *= -bounce
  }
}

// 球碰撞
function handleBallCollisions() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const b1 = balls[i]
      const b2 = balls[j]
      const dx = b2.x - b1.x
      const dy = b2.y - b1.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = b1.radius + b2.radius

      if (dist < minDist && dist > 0) {
        const nx = dx / dist
        const ny = dy / dist
        const dvx = b1.vx - b2.vx
        const dvy = b1.vy - b2.vy
        const dvn = dvx * nx + dvy * ny

        if (dvn > 0) {
          const impulse = dvn * bounce
          if (!b1.isDragging) { b1.vx -= impulse * nx; b1.vy -= impulse * ny }
          if (!b2.isDragging) { b2.vx += impulse * nx; b2.vy += impulse * ny }
        }

        const overlap = minDist - dist
        if (!b1.isDragging) { b1.x -= overlap * nx * 0.5; b1.y -= overlap * ny * 0.5 }
        if (!b2.isDragging) { b2.x += overlap * nx * 0.5; b2.y += overlap * ny * 0.5 }
      }
    }
  }
}

// 更新
function update() {
  balls.forEach(ball => {
    if (!ball.isDragging) {
      ball.vx *= friction
      ball.vy *= friction
      ball.x += ball.vx
      ball.y += ball.vy
      handleWallCollision(ball)
    }
  })
  handleBallCollisions()
}

// 绘制
function draw() {
  ctx.clearRect(0, 0, width, height)
  balls.forEach(drawBall)
}

// 动画循环
function animate() {
  update()
  draw()
  animationId = requestAnimationFrame(animate)
}

// 获取搜索卡片位置
function getSearchCardRect() {
  const searchCard = document.getElementById('searchCard')
  return searchCard ? searchCard.getBoundingClientRect() : null
}

// 鼠标事件
function onMouseDown(e) {
  const pos = { x: e.clientX, y: e.clientY }
  mousePos = pos
  lastMousePos = { ...pos }

  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i]
    const dx = pos.x - ball.x
    const dy = pos.y - ball.y
    if (Math.sqrt(dx * dx + dy * dy) < ball.radius) {
      draggedBall = ball
      isDragging = true
      ball.isDragging = true
      ball.vx = 0
      ball.vy = 0
      canvasRef.value.classList.add('dragging')
      break
    }
  }
}

function onMouseMove(e) {
  const pos = { x: e.clientX, y: e.clientY }
  lastMousePos = { ...mousePos }
  mousePos = pos

  if (isDragging && draggedBall) {
    draggedBall.x = pos.x
    draggedBall.y = pos.y
    draggedBall.vx = (pos.x - lastMousePos.x) * 0.5
    draggedBall.vy = (pos.y - lastMousePos.y) * 0.5

    // 检测搜索卡片
    const rect = getSearchCardRect()
    const searchCard = document.getElementById('searchCard')
    if (rect && pos.x >= rect.left && pos.x <= rect.right &&
        pos.y >= rect.top && pos.y <= rect.bottom) {
      searchCard.classList.add('drag-over')
    } else {
      searchCard.classList.remove('drag-over')
    }
  }

  // 更新鼠标样式
  let hovered = false
  for (const ball of balls) {
    if (isBallHovered(ball)) {
      hovered = true
      break
    }
  }
  canvasRef.value.style.cursor = hovered ? 'grab' : 'default'
}

function onMouseUp() {
  canvasRef.value.classList.remove('dragging')

  if (draggedBall) {
    const rect = getSearchCardRect()
    if (rect && mousePos.x >= rect.left && mousePos.x <= rect.right &&
        mousePos.y >= rect.top && mousePos.y <= rect.bottom) {
      if (window.setSearchKeyword) {
        window.setSearchKeyword(draggedBall.tech.name)
      }
    }
    draggedBall.isDragging = false
  }
  draggedBall = null
  isDragging = false
  document.getElementById('searchCard')?.classList.remove('drag-over')
}

function onTouchStart(e) {
  e.preventDefault()
  const touch = e.touches[0]
  onMouseDown({ clientX: touch.clientX, clientY: touch.clientY })
}

function onTouchMove(e) {
  e.preventDefault()
  const touch = e.touches[0]
  onMouseMove({ clientX: touch.clientX, clientY: touch.clientY })
}

function onTouchEnd() {
  onMouseUp()
}

// 调整大小
function resize() {
  const dpr = window.devicePixelRatio || 1
  width = window.innerWidth
  height = window.innerHeight
  canvasRef.value.width = width * dpr
  canvasRef.value.height = height * dpr
  canvasRef.value.style.width = width + 'px'
  canvasRef.value.style.height = height + 'px'
  ctx.scale(dpr, dpr)

  balls.forEach(ball => {
    ball.x = Math.min(Math.max(ball.radius, ball.x), width - ball.radius)
    ball.y = Math.min(Math.max(ball.radius, ball.y), height - ball.radius)
  })
}

onMounted(async () => {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')

  resize()
  await loadIcons()
  createBalls()

  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('mouseleave', onMouseUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)
  window.addEventListener('resize', resize)

  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas ref="canvasRef" class="physics-canvas"></canvas>
</template>

<style scoped>
.physics-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transition: z-index 0s;
}

.physics-canvas.dragging {
  z-index: 100;
}
</style>