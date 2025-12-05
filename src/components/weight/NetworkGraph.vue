<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { AchievementNetwork, NetworkGraphData } from '@/types/weight'
import { FullscreenOutlined, DownloadOutlined } from '@ant-design/icons-vue'

use([
  GraphChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  CanvasRenderer,
])

interface Props {
  data: AchievementNetwork | null
  loading?: boolean
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  height: 600,
})

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const isFullscreen = ref(false)

const hasData = computed(() =>
  props.data !== null &&
  props.data.achievement_network &&
  props.data.achievement_network.length > 0
)

// Relationship type color mapping (8 types)
const relationshipColors: Record<string, string> = {
  'PHD_ADVISOR': '#ff4d4f',              // 红色 - 导师
  'LABMATE': '#722ed1',                  // 紫色 - 实验室伙伴
  'PAPER_COAUTHOR': '#1890ff',           // 蓝色 - 论文合著
  'OPEN_SOURCE_COLLABORATOR': '#52c41a', // 绿色 - 开源协作
  'COLLEAGUE': '#faad14',                // 橙色 - 同事
  'FORMER_COLLEAGUE': '#fa8c16',         // 深橙 - 前同事
  'ALUMNI': '#13c2c2',                   // 青色 - 校友
  'SKILL_DOMAIN_EXPERT': '#eb2f96',      // 品红 - 技能专家
}

const relationshipLabels: Record<string, string> = {
  'PHD_ADVISOR': '👨‍🏫 博士导师',
  'LABMATE': '🧑‍🔬 实验室伙伴',
  'PAPER_COAUTHOR': '📝 论文合著者',
  'OPEN_SOURCE_COLLABORATOR': '💻 开源协作者',
  'COLLEAGUE': '🤝 同事',
  'FORMER_COLLEAGUE': '👔 前同事',
  'ALUMNI': '🎓 校友',
  'SKILL_DOMAIN_EXPERT': '🎯 技能领域专家',
}

// Convert AchievementNetwork to graph data
const graphData = computed((): NetworkGraphData | null => {
  if (!props.data || !props.data.achievement_network) {
    return null
  }

  const nodes = props.data.achievement_network
  const relationshipTypes = [...new Set(nodes.map(n => n.relationship_type))]

  // Create category map
  const categoryMap = new Map<string, number>()
  relationshipTypes.forEach((type, index) => {
    categoryMap.set(type, index)
  })

  // Create graph nodes - target user is implicit, shown as connections
  const graphNodes = nodes.map((node, index) => {
    const relationshipTypeUpper = (node.relationship_type || '').toUpperCase()
    const typeLabel = relationshipLabels[relationshipTypeUpper] || node.relationship_type
    return {
      id: `node_${index}`,
      name: node.name,
      value: node.final_score,
      category: categoryMap.get(node.relationship_type),
      relationshipType: node.relationship_type,  // 保持原始格式用于存储
      typeLabel: typeLabel,
    }
  })

  // Minimal edges - only connect top scoring nodes for visual reference
  const graphEdges = nodes
    .slice()
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, Math.min(5, Math.floor(nodes.length / 2)))
    .map((node, index, arr) => {
      const nodeIndex = nodes.indexOf(node)
      const targetNode = arr[index + 1] ?? arr[0]
      if (!targetNode) {
        return null
      }
      const nextIndex = nodes.indexOf(targetNode)
      if (nodeIndex < 0 || nextIndex < 0) {
        return null
      }
      return {
        source: `node_${nodeIndex}`,
        target: `node_${nextIndex}`,
        value: node.closeness_score,
      }
    })
    .filter((edge): edge is { source: string; target: string; value: number } => edge !== null)

  const categories = relationshipTypes.map(type => {
    const typeUpper = (type || '').toUpperCase()
    return {
      name: relationshipLabels[typeUpper] || type.replace(/_/g, ' '),
    }
  })

  return {
    nodes: graphNodes,
    edges: graphEdges,
    categories,
  }
})

const chartOption = computed(() => {
  const data = graphData.value
  if (!data) {
    return {}
  }

  return {
    title: {
      text: '',
      subtext: ``,
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#262626',
      },
      subtextStyle: {
        fontSize: 13,
        color: '#8c8c8c',
      },
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      className: 'network-tooltip',
      appendToBody: true,
      enterable: true,
      hideDelay: 300,
      position: function (point: any, _params: any, dom: any, _rect: any, size: any) {
        // 智能定位，避免穿模
        const chartWidth = size.viewSize[0]
        const chartHeight = size.viewSize[1]

        // 使用DOM实际尺寸（如果可用）
        const tooltipWidth = dom ? dom.offsetWidth : (size.contentSize[0] || 350)
        const tooltipHeight = dom ? dom.offsetHeight : (size.contentSize[1] || 300)

        const x = point[0]
        const y = point[1]

        // 默认显示在右侧，但要留出足够边距
        let posX = x + 20
        let posY = y - tooltipHeight / 2

        // 右侧空间不足，显示在左侧
        if (posX + tooltipWidth + 20 > chartWidth) {
          posX = x - tooltipWidth - 20
        }

        // 左侧也不够，强制居中
        if (posX < 10) {
          posX = Math.max(10, (chartWidth - tooltipWidth) / 2)
        }

        // 垂直位置调整，确保完全在视图内
        if (posY < 10) {
          posY = 10
        } else if (posY + tooltipHeight + 20 > chartHeight) {
          posY = chartHeight - tooltipHeight - 20
        }

        // 最终边界检查
        posX = Math.max(10, Math.min(posX, chartWidth - tooltipWidth - 10))
        posY = Math.max(10, Math.min(posY, chartHeight - tooltipHeight - 10))

        return [posX, posY]
      },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const nodeIndex = parseInt(params.data.id.replace('node_', ''))
          const achievementNode = props.data?.achievement_network[nodeIndex]

          if (!achievementNode) return ''

          const avatarHtml = achievementNode.avatar_url
            ? `<img src="${achievementNode.avatar_url}" style="width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />`
            : ''

          const relationshipTypeUpper = (achievementNode.relationship_type || '').toUpperCase()
          const relationshipLabel = relationshipLabels[relationshipTypeUpper] || achievementNode.relationship_type.replace(/_/g, ' ')
          const relationshipColor = relationshipColors[relationshipTypeUpper] || '#1890ff'

          // Format sources array
          const sources = Array.isArray(achievementNode.sources)
            ? achievementNode.sources.join(', ')
            : achievementNode.source || 'N/A'

          return `
            <div style="padding: 12px; max-width: 340px; max-height: 450px; overflow-y: auto;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                ${avatarHtml}
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px; color: #262626; word-break: break-word;">${achievementNode.name}</div>
                  ${achievementNode.github_username ? `<div style="font-size: 11px; color: #8c8c8c; word-break: break-word;">@${achievementNode.github_username}</div>` : ''}
                  ${achievementNode.affiliation ? `<div style="font-size: 11px; color: #595959; margin-top: 2px; word-break: break-word;">📍 ${achievementNode.affiliation}</div>` : ''}
                </div>
              </div>
              <div style="font-size: 13px; color: #595959; line-height: 2;">
                <div style="margin-bottom: 6px;">
                  <strong>关系类型:</strong>
                  <span style="color: ${relationshipColor}; font-weight: 600; margin-left: 4px;">${relationshipLabel}</span>
                </div>
                ${achievementNode.collaboration_frequency ? `
                  <div style="margin-bottom: 6px;">
                    <strong>合作频率:</strong> ${achievementNode.collaboration_frequency} 次
                  </div>
                ` : ''}
                ${achievementNode.collaboration_time ? `
                  <div style="margin-bottom: 6px;">
                    <strong>合作时间:</strong> ${achievementNode.collaboration_time}
                  </div>
                ` : ''}
                <div style="margin-bottom: 6px;">
                  <strong>数据来源:</strong>
                  <span style="background: #e6f7ff; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${sources}</span>
                </div>
                ${achievementNode.reason_for_inclusion ? `
                  <div style="margin-top: 8px; padding: 8px; background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%); border-radius: 4px; border-left: 3px solid ${relationshipColor};">
                    <div style="font-size: 10px; font-weight: 600; color: #8c8c8c; margin-bottom: 4px; text-transform: uppercase;">💡 关系说明</div>
                    <div style="font-size: 11px; color: #595959; line-height: 1.5; word-break: break-word; max-height: 100px; overflow-y: auto;">${achievementNode.reason_for_inclusion}</div>
                  </div>
                ` : ''}
                ${achievementNode.representative_collaboration ? `
                  <div style="margin-top: 10px; padding: 10px; background: #f0f5ff; border-radius: 6px; border-left: 3px solid #1890ff;">
                    <div style="font-size: 11px; font-weight: 600; color: #1890ff; margin-bottom: 6px;">🏆 代表作</div>
                    ${achievementNode.representative_collaboration.type === 'Repository' ? `
                      <div style="font-size: 12px; color: #262626; font-weight: 500;">${achievementNode.representative_collaboration.name}</div>
                      <div style="font-size: 11px; color: #8c8c8c; margin-top: 2px;">⭐ ${achievementNode.representative_collaboration.stars || 0} stars</div>
                    ` : achievementNode.representative_collaboration.type === 'Publication' ? `
                      <div style="font-size: 12px; color: #262626; font-weight: 500; line-height: 1.4;">${achievementNode.representative_collaboration.title}</div>
                      <div style="font-size: 11px; color: #8c8c8c; margin-top: 4px;">${achievementNode.representative_collaboration.venue} ${achievementNode.representative_collaboration.year || ''}</div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          `
        } else if (params.dataType === 'edge') {
          return `
            <div style="padding: 6px 10px;">
              <div style="font-size: 12px; color: #595959;">
                连接强度: ${params.data.value?.toFixed(2) || 'N/A'}
              </div>
            </div>
          `
        }
        return ''
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 80,
      data: data.categories?.map((c) => c.name) || [],
      textStyle: {
        fontSize: 12,
        color: '#595959',
      },
    },
    toolbox: {
      show: true,
      right: 20,
      top: 20,
      feature: {
        saveAsImage: {
          title: '保存为图片',
          pixelRatio: 2,
        },
        restore: {
          title: '还原',
        },
      },
      iconStyle: {
        borderColor: '#4096ff',
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: data.nodes.map((node, index) => {
          const achievementNode = props.data?.achievement_network[index]
          const hasAvatar = achievementNode?.avatar_url
          const relationshipType = ((node as any).relationshipType || '').toUpperCase()
          const categoryColor = relationshipColors[relationshipType] || '#4096ff'
          // Create composite symbol with avatar and color indicator
          const size = Math.max(50, Math.min(90, (node.value || 1) * 8))

          // 调试日志
          console.log(`Node ${index}: ${node.name} - relationshipType=${relationshipType}, color=${categoryColor}`)

          return {
            id: node.id,
            name: node.name,
            value: node.value || 0,
            category: node.category,
            symbolSize: size,
            symbol: hasAvatar ? `image://${achievementNode.avatar_url}` : 'circle',
            // 存储关系类型和颜色信息到节点数据中
            relationshipType: relationshipType,
            categoryColor: categoryColor,
            label: {
              show: true,
              position: 'bottom',
              distance: 10,
              formatter: (params: any) => {
                return `{dot|●} {name|${params.name}}`
              },
              rich: {
                dot: {
                  fontSize: 14,
                  color: categoryColor,
                  fontWeight: 'bold',
                },
                name: {
                  fontSize: 12,
                  color: '#262626',
                  fontWeight: 500,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: [5, 10],
                  borderRadius: 6,
                  shadowBlur: 4,
                  shadowColor: 'rgba(0, 0, 0, 0.1)',
                },
              },
            },
            itemStyle: {
              borderWidth: 4,
              borderColor: categoryColor,
              shadowBlur: 12,
              shadowColor: categoryColor + '60',
              color: hasAvatar ? undefined : categoryColor,
            },
            emphasis: {
              itemStyle: {
                borderWidth: 5,
                shadowBlur: 20,
                shadowColor: categoryColor + '80',
              },
            },
          }
        }),
        edges: data.edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          value: edge.value || 0,
          lineStyle: {
            width: 1.5,
            opacity: 0.15,
            color: '#d9d9d9',
            curveness: 0.1,
          },
        })),
        categories: data.categories?.map((cat) => {
          // 从label反向查找type key
          const matchedType = Object.keys(relationshipLabels).find(
            key => relationshipLabels[key] === cat.name
          )

          return {
            name: cat.name,
            itemStyle: {
              color: matchedType ? relationshipColors[matchedType] : '#4096ff',
            },
          }
        }),
        roam: true,
        draggable: true,
        force: {
          repulsion: 400,
          edgeLength: [100, 200],
          gravity: 0.08,
        },
        emphasis: {
          focus: 'self',
          scale: 1.2,
          lineStyle: {
            width: 2,
            opacity: 0.3,
          },
        },
        lineStyle: {
          color: '#d9d9d9',
          curveness: 0.1,
        },
      },
    ],
  }
})

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function saveAsImage() {
  if (chartRef.value) {
    const instance = chartRef.value
    // @ts-ignore
    const url = instance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff',
    })
    const link = document.createElement('a')
    link.href = url
    link.download = `achievement-network-${Date.now()}.png`
    link.click()
  }
}

watch(
  () => props.data,
  () => {
    if (chartRef.value) {
      // @ts-ignore
      chartRef.value.resize()
    }
  }
)
</script>

<template>
  <a-card :bordered="false" class="network-graph-card" :class="{ fullscreen: isFullscreen }">
    <template #title>
      <span>关键人物TOP6</span>
    </template>
    <template #extra>
      <a-space>
        <a-tooltip title="下载图片">
          <a-button
            type="text"
            size="small"
            :disabled="!hasData"
            @click="saveAsImage"
          >
            <template #icon>
              <DownloadOutlined />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip :title="isFullscreen ? '退出全屏' : '全屏显示'">
          <a-button
            type="text"
            size="small"
            :disabled="!hasData"
            @click="toggleFullscreen"
          >
            <template #icon>
              <FullscreenOutlined />
            </template>
          </a-button>
        </a-tooltip>
      </a-space>
    </template>

    <div v-if="loading" class="graph-loading">
      <a-spin size="large" tip="生成网络图谱中..." />
    </div>

    <div v-else-if="!hasData" class="graph-empty">
      <a-empty description="暂无数据">
        <template #description>
          <p style="color: #8c8c8c">请先生成网络预览或提交任务</p>
        </template>
      </a-empty>
    </div>

    <div v-else class="graph-container">
      <v-chart
        ref="chartRef"
        :option="chartOption"
        :style="{ height: `${height}px`, width: '100%' }"
        autoresize
      />
    </div>

  </a-card>
</template>

<style scoped>
.network-graph-card {
  position: relative;
  transition: all 0.3s;
}

.network-graph-card.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  margin: 0;
  border-radius: 0;
}

.network-graph-card.fullscreen .graph-container {
  height: calc(100vh - 180px) !important;
}

.graph-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.graph-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.graph-container {
  width: 100%;
  position: relative;
}

.graph-stats {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
}

.graph-stats :deep(.ant-statistic-title) {
  font-size: 12px;
  color: #8c8c8c;
}

.graph-stats :deep(.ant-statistic-content) {
  color: #4096ff;
}

/* Card styling */
:deep(.ant-card-head) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

:deep(.ant-card-body) {
  padding: 24px;
}

/* Tooltip样式 - 避免穿模 */
:deep(.network-tooltip) {
  max-width: 360px !important;
  max-height: 500px !important;
  overflow: visible !important;
  z-index: 9999 !important;
  pointer-events: auto !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
}

/* 滚动条样式 */
:deep(.network-tooltip) ::-webkit-scrollbar {
  width: 6px;
}

:deep(.network-tooltip) ::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.network-tooltip) ::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

:deep(.network-tooltip) ::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
