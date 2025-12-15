import axios from 'axios'
import apiClient from './api'

interface UploadTokenResponse {
  upload_url: string
  file_url: string
}

export const uploadService = {
  /**
   * 完整上传流程: 获取 OSS 凭证 → 上传文件
   * @param file - 要上传的文件
   * @returns file_url - OSS 上的文件 URL
   */
  async uploadFile(file: File): Promise<string> {
    // Step 1: 获取 OSS 上传凭证
    const response = await apiClient.post<{
      code: number
      data: UploadTokenResponse
      message: string
    }>('/upload/url', {
      file_name: file.name,
      file_size: file.size,
      content_type: file.type,
    })

    const uploadToken = response.data.data

    // Step 2: 使用预签名 URL 直接上传到 OSS
    const uploadResponse = await axios.put(uploadToken.upload_url, file, {
      headers: {
        'Content-Type': file.type,
      },
      transformRequest: [(data) => data],
    })

    if (uploadResponse.status !== 200) {
      throw new Error('Failed to upload file to OSS')
    }

    return uploadToken.file_url
  },
}
