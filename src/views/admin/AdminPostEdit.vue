<template>
  <div class="post-editor">
    <div class="editor-header">
      <h1>{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
      <div class="header-actions">
        <button @click="saveDraft" class="save-draft-btn" :disabled="saving">
          保存草稿
        </button>
        <button @click="publish" class="publish-btn" :disabled="saving">
          {{ saving ? '保存中...' : (isEdit ? '更新' : '发布') }}
        </button>
      </div>
    </div>

    <div class="editor-content">
      <!-- 标题输入 -->
      <div class="form-group">
        <input
          v-model="form.title"
          type="text"
          class="title-input"
          placeholder="请输入文章标题..."
        />
      </div>

      <!-- 元信息 -->
      <div class="meta-row">
        <div class="form-group">
          <label>分类</label>
          <select v-model="form.categoryId" class="meta-select">
            <option :value="null">选择分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>标签（回车添加）</label>
          <div class="tags-input">
            <div class="tags-list">
              <span v-for="(tag, index) in form.tags" :key="index" class="tag-item">
                {{ tag }}
                <button @click="removeTag(index)" type="button">×</button>
              </span>
            </div>
            <input
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              type="text"
              placeholder="输入标签..."
            />
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="form.pinned" />
            置顶文章
          </label>
        </div>
      </div>

      <!-- 摘要 -->
      <div class="form-group">
        <label>摘要（可选，留空自动生成）</label>
        <textarea
          v-model="form.excerpt"
          class="excerpt-input"
          placeholder="文章摘要..."
          rows="2"
        ></textarea>
      </div>

      <!-- Markdown 编辑器 -->
      <div class="editor-wrapper">
        <MdEditor
          v-model="form.content"
          :theme="editorTheme"
          :toolbars="editorToolbars"
          :preview="true"
          :previewTheme="previewTheme"
          :codeTheme="codeTheme"
          :style="{ height: editorHeight }"
          @onUploadImg="handleUploadImage"
          placeholder="开始编写文章内容..."
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { postApi, categoryApi, uploadApi } from '../../api'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)

const form = ref({
  id: null,
  title: '',
  content: '',
  excerpt: '',
  categoryId: null,
  tags: [],
  pinned: false
})

const tagInput = ref('')
const categories = ref([])
const saving = ref(false)
const loading = ref(false)

// 编辑器配置
const editorTheme = ref('dark')
const previewTheme = ref('github-dark')
const codeTheme = ref('github-dark')
const editorHeight = ref('calc(100vh - 420px)')

// 自定义工具栏
const editorToolbars = [
  'bold',
  'underline',
  'italic',
  '-',
  'title',
  'strikeThrough',
  'sub',
  'sup',
  'quote',
  '-',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  '-',
  'revoke',
  'next',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'catalog'
]

onMounted(async () => {
  await loadCategories()

  if (isEdit.value) {
    await loadPost()
  }
})

async function loadCategories() {
  try {
    const res = await categoryApi.getList()
    categories.value = res.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadPost() {
  loading.value = true
  try {
    const res = await postApi.getDetail(route.params.id)
    const post = res.data
    form.value = {
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      categoryId: post.categoryId,
      tags: post.tags || [],
      pinned: post.pinned
    }
  } catch (error) {
    console.error('加载文章失败:', error)
    alert('文章不存在')
    router.push('/admin/posts')
  } finally {
    loading.value = false
  }
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  tagInput.value = ''
}

function removeTag(index) {
  form.value.tags.splice(index, 1)
}

// 图片上传处理
async function handleUploadImage(files, callback) {
  for (const file of files) {
    try {
      const res = await uploadApi.uploadImage(file)
      // callback 参数：图片 URL 数组
      callback([res.data.url])
    } catch (error) {
      console.error('图片上传失败:', error)
      alert('图片上传失败，请重试')
    }
  }
}

// 保存草稿（可以添加草稿状态）
function saveDraft() {
  savePost()
}

// 发布/更新
async function publish() {
  if (!form.value.title.trim()) {
    alert('请输入文章标题')
    return
  }
  if (!form.value.content.trim()) {
    alert('请输入文章内容')
    return
  }

  await savePost()
}

async function savePost() {
  saving.value = true
  try {
    const data = {
      title: form.value.title,
      content: form.value.content,
      excerpt: form.value.excerpt || null,
      categoryId: form.value.categoryId,
      tags: form.value.tags,
      pinned: form.value.pinned
    }

    if (isEdit.value) {
      data.id = form.value.id
      await postApi.update(form.value.id, data)
    } else {
      await postApi.create(data)
    }

    router.push('/admin/posts')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.post-editor {
  max-width: 1200px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.editor-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.save-draft-btn, .publish-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-draft-btn {
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

.save-draft-btn:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.2);
}

.publish-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  color: white;
}

.publish-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.save-draft-btn:disabled, .publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-content {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.title-input {
  width: 100%;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 20px;
  font-weight: 600;
}

.title-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.title-input::placeholder {
  color: #64748b;
  font-weight: 400;
}

.meta-row {
  display: grid;
  grid-template-columns: 200px 1fr 120px;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .meta-row {
    grid-template-columns: 1fr;
  }
}

.meta-select {
  width: 100%;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;
  cursor: pointer;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  min-height: 42px;
}

.tags-input input {
  flex: 1;
  min-width: 100px;
  background: none;
  border: none;
  color: #f1f5f9;
  font-size: 14px;
  outline: none;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-radius: 4px;
  font-size: 13px;
}

.tag-item button {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  opacity: 0.7;
}

.tag-item button:hover {
  opacity: 1;
}

.checkbox-group {
  display: flex;
  align-items: flex-end;
  padding-bottom: 4px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  cursor: pointer;
  color: #e2e8f0;
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
}

.excerpt-input {
  width: 100%;
  padding: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.excerpt-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.editor-wrapper {
  margin-top: 16px;
}

/* Markdown 编辑器深色主题覆盖 */
:deep(.md-editor) {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
}

:deep(.md-editor-toolbar-wrapper) {
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

:deep(.md-editor-content) {
  background: transparent;
}

:deep(.md-editor-input-wrapper) {
  background: transparent;
}

:deep(.md-editor-input) {
  background: transparent;
  color: #e2e8f0;
}

:deep(.md-editor-preview-wrapper) {
  background: rgba(15, 23, 42, 0.4);
  border-left: 1px solid rgba(148, 163, 184, 0.1);
}

:deep(.md-editor-scrn) {
  background: rgba(15, 23, 42, 0.8);
}
</style>