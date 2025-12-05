<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ExperimentOutlined, GithubOutlined, LinkedinOutlined } from '@ant-design/icons-vue'
import type { UserData, SocialUrls } from '@/types/weight'
import { saveToStorage, loadFromStorage } from '@/utils/storage'

interface Emits {
  (e: 'generate', userData: UserData, socialUrls?: SocialUrls): void
}

const emit = defineEmits<Emits>()

const STORAGE_KEY_USER_DATA = 'dinq_test_form_user_data'
const STORAGE_KEY_SOCIAL_URLS = 'dinq_test_form_social_urls'

// Form data
const userData = ref<UserData>({
  name: '',
  email: '',
  bio: '',
})

const socialUrls = ref<SocialUrls>({
  github: '',
  linkedin: '',
  scholar: '',
  twitter: '',
})

// Load cached data on mount
onMounted(() => {
  const cachedUserData = loadFromStorage(STORAGE_KEY_USER_DATA, null)
  const cachedSocialUrls = loadFromStorage(STORAGE_KEY_SOCIAL_URLS, null)

  if (cachedUserData) {
    userData.value = cachedUserData
  }

  if (cachedSocialUrls) {
    socialUrls.value = cachedSocialUrls
  }
})

// Auto-save to storage when data changes
watch(userData, (newValue) => {
  saveToStorage(STORAGE_KEY_USER_DATA, newValue)
}, { deep: true })

watch(socialUrls, (newValue) => {
  saveToStorage(STORAGE_KEY_SOCIAL_URLS, newValue)
}, { deep: true })

function handleGenerate() {
  if (!userData.value.name.trim()) {
    return
  }

  // Filter out empty social URLs
  const filteredSocialUrls: SocialUrls = {}
  Object.entries(socialUrls.value).forEach(([key, value]) => {
    if (value && value.trim()) {
      filteredSocialUrls[key] = value.trim()
    }
  })

  emit('generate', userData.value, filteredSocialUrls)
}

function fillExample() {
  userData.value = {
    name: 'Yann LeCun',
    email: 'yann.lecun@nyu.edu',
    bio: 'Professor at NYU, Chief AI Scientist at Meta',
  }
  socialUrls.value = {
    github: 'https://github.com/ylecun',
    linkedin: 'https://www.linkedin.com/in/yann-lecun/',
    scholar: 'https://scholar.google.com/citations?user=WLN3QrAAAAAJ',
    twitter: 'https://twitter.com/ylecun',
  }
}

function clearForm() {
  userData.value = {
    name: '',
    email: '',
    bio: '',
  }
  socialUrls.value = {
    github: '',
    linkedin: '',
    scholar: '',
    twitter: '',
  }
  // Clear storage
  saveToStorage(STORAGE_KEY_USER_DATA, null)
  saveToStorage(STORAGE_KEY_SOCIAL_URLS, null)
}
</script>

<template>
  <a-card title="" :bordered="false" class="test-form-card">
    <template #extra>
      <a-space>
        <a-button size="small" @click="clearForm">清空</a-button>
        <a-button size="small" type="primary" @click="fillExample">填充示例</a-button>
      </a-space>
    </template>

    <a-form layout="vertical" class="test-form">
      <!-- User Data Section -->
      <div class="form-section">
        <h4 class="section-title">用户信息</h4>

        <a-form-item label="姓名 *" required>
          <a-input
            v-model:value="userData.name"
            placeholder="请输入姓名，如: Yann LeCun"
            size="large"
          />
        </a-form-item>

        <a-form-item label="邮箱">
          <a-input
            v-model:value="userData.email"
            placeholder="可选"
            type="email"
          />
        </a-form-item>

        <a-form-item label="简介">
          <a-textarea
            v-model:value="userData.bio"
            placeholder="可选"
            :rows="2"
          />
        </a-form-item>
      </div>

      <!-- Social URLs Section -->
      <div class="form-section">
        <h4 class="section-title">社交链接（选填）</h4>

        <a-form-item label="GitHub">
          <a-input
            v-model:value="socialUrls.github"
            placeholder="https://github.com/username"
          >
            <template #prefix>
              <GithubOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="LinkedIn">
          <a-input
            v-model:value="socialUrls.linkedin"
            placeholder="https://www.linkedin.com/in/username/"
          >
            <template #prefix>
              <LinkedinOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="Google Scholar">
          <a-input
            v-model:value="socialUrls.scholar"
            placeholder="https://scholar.google.com/citations?user=..."
          />
        </a-form-item>

        <a-form-item label="Twitter/X">
          <a-input
            v-model:value="socialUrls.twitter"
            placeholder="https://twitter.com/username"
          />
        </a-form-item>
      </div>

      <!-- Submit Button -->
      <a-form-item>
        <a-button
          type="primary"
          size="large"
          block
          :disabled="!userData.name.trim()"
          @click="handleGenerate"
        >
          <template #icon>
            <ExperimentOutlined />
          </template>
          生成
        </a-button>
      </a-form-item>

      <!-- Help Text -->

    </a-form>
  </a-card>
</template>

<style scoped>
.test-form-card {
  height: 100%;
}

.test-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

/* Scrollbar */
.test-form::-webkit-scrollbar {
  width: 6px;
}

.test-form::-webkit-scrollbar-track {
  background: transparent;
}

.test-form::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}
</style>
