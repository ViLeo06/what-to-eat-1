import type { Recipe } from '@/types'

const normalizeBaseURL = (url: string | undefined, fallback: string): string => {
    const candidate = (url ?? fallback).trim()
    return candidate.replace(/\/+$/, '')
}

// 图片生成模型配置 - 从环境变量读取
const IMAGE_CONFIG = {
    apiKey: import.meta.env.VITE_IMAGE_GENERATION_API_KEY,
    baseURL: normalizeBaseURL(import.meta.env.VITE_IMAGE_GENERATION_BASE_URL, 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
    model: import.meta.env.VITE_IMAGE_GENERATION_MODEL || 'qwen3-max'
}

// 阿里云原生图片生成API端点 - 通过Vite代理访问
const API_URL = '/api/dashscope/api/v1/services/aigc/text2image/image-synthesis'

export interface GeneratedImage {
    url: string
    id: string
}

export const generateRecipeImage = async (recipe: Recipe): Promise<GeneratedImage> => {
    // 构建图片生成的提示词
    const prompt = buildImagePrompt(recipe)

    try {
        // 使用异步调用方式
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${IMAGE_CONFIG.apiKey}`,
                'X-DashScope-Async': 'enable'
            },
            body: JSON.stringify({
                model: IMAGE_CONFIG.model,
                input: {
                    prompt: prompt
                },
                parameters: {
                    size: '1328*1328',
                    n: 1
                }
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.message || errorData.error?.message || `API请求失败: ${response.status}`
            console.error('图片生成API错误:', { status: response.status, error: errorData })
            throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log('图片生成API响应:', data)

        // 异步任务，需要轮询获取结果
        if (data.output && data.output.task_id) {
            const taskId = data.output.task_id
            const imageUrl = await pollTaskResult(taskId)
            return {
                url: imageUrl,
                id: `${recipe.id}-${Date.now()}`
            }
        } else {
            throw new Error('API返回数据格式错误: ' + JSON.stringify(data))
        }
    } catch (error) {
        console.error('生成图片失败:', error)
        throw error
    }
}

// 轮询任务结果
const pollTaskResult = async (taskId: string, maxAttempts: number = 30): Promise<string> => {
    const getTaskUrl = `/api/dashscope/api/v1/tasks/${taskId}`

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒

        const response = await fetch(getTaskUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${IMAGE_CONFIG.apiKey}`
            }
        })

        if (!response.ok) {
            throw new Error(`查询任务状态失败: ${response.status}`)
        }

        const data = await response.json()
        console.log('任务状态:', data)

        if (data.output && data.output.task_status === 'SUCCEEDED') {
            if (data.output.results && data.output.results.length > 0) {
                return data.output.results[0].url
            }
        } else if (data.output && data.output.task_status === 'FAILED') {
            const errorMsg = data.output.message || data.output.code || '未知错误'
            console.error('任务失败详情:', data.output)
            throw new Error(`图片生成任务失败: ${errorMsg}`)
        }
    }

    throw new Error('图片生成超时')
}

const buildImagePrompt = (recipe: Recipe): string => {
    // 根据菜谱信息构建详细的图片生成提示词
    const ingredients = recipe.ingredients.join('、')
    const cuisineStyle = recipe.cuisine.replace('大师', '').replace('菜', '')

    return `一道精美的${cuisineStyle}菜肴：${recipe.name}，主要食材包括${ingredients}。菜品摆盘精致，色彩丰富，光线柔和，专业美食摄影风格，高清画质，餐厅级别的视觉效果。背景简洁，突出菜品本身的美感。`
}
