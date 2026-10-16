<template>
  <div class="hero-visual" role="img" aria-label="知识的地形：等高线与网格">
    <div class="visual-label">FIELD / 001　知识的地形</div>
    <svg
      viewBox="0 0 460 310"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="contour-grid"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M24 0H0V24"
            fill="none"
            stroke="var(--line)"
            stroke-width=".75"
            opacity=".6"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#contour-grid)" />
      <g
        fill="none"
        stroke="var(--green)"
        stroke-width="1.2"
        opacity=".5"
        transform="translate(250 145) rotate(-20)"
      >
        <ellipse
          v-for="n in 8"
          :key="n"
          :rx="195 - n * 20"
          :ry="118 - n * 13"
        />
      </g>
      <path
        d="M60 230Q140 180 200 195T320 110T400 70"
        fill="none"
        stroke="var(--rust)"
        stroke-width="1.8"
        stroke-dasharray="4 4"
      />
      <circle cx="200" cy="195" r="4.5" fill="var(--rust)" />
      <circle cx="320" cy="110" r="4.5" fill="var(--rust)" />
      <g
        fill="var(--green)"
        font-family="var(--mono)"
        font-size="9"
        letter-spacing="1"
      >
        <text x="160" y="180">QUESTION / 问题</text>
        <text x="310" y="95">PRACTICE / 验证</text>
      </g>
    </svg>
    <div class="visual-caption">
      <b>Stay curious.</b><small>CODE × GEO × AI<br />实践长出来的认知</small>
    </div>
  </div>
</template>
