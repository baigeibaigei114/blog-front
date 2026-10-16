<script setup>
import { site } from '../config/site'
import VerificationBadge from '../components/content/VerificationBadge.vue'
</script>
<template>
  <article class="about-copy">
    <div class="eyebrow">ABOUT THIS NOTEBOOK</div>
    <h1>一个持续生长的<br />个人技术笔记本。</h1>
    <blockquote>
      记录不仅是为了备忘，<br />更是为了看清理解如何发生。
    </blockquote>
    <p>我是{{ site.author }}。{{ site.about }}</p>
    <h2>来源清楚，边界明确。</h2>
    <p>
      来源工具标识说明内容的整理来源。AI
      辅助整理并不代表结论已经得到验证，每篇内容分别标注验证状态。
    </p>
    <div class="actions">
      <VerificationBadge
        :verification="{ status: 'UNVERIFIED' }"
      /><VerificationBadge
        :verification="{ status: 'CONCEPT_ONLY' }"
      /><VerificationBadge :verification="{ status: 'TESTED' }" />
    </div>
    <p>
      “有实测依据”取自该公开内容版本的验证记录，适用条件以文末说明为准。没有公开证据的内容保持未验证或概念整理。
    </p>
    <div class="actions">
      <RouterLink to="/posts" class="primary">翻阅技术文章 ↗</RouterLink
      ><RouterLink to="/notes" class="secondary">浏览学习日志</RouterLink>
    </div>
  </article>
</template>
