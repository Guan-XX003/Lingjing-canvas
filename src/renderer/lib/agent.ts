/**
 * 智能体（Agent）聊天域纯函数：知识库分块与检索、附件类型/大小/元信息、
 * 图标与附件 SVG 渲染、时间格式化、会话文本清洗、聊天栏样式等。
 * 纯函数（不依赖 React state），自 WanJuanAppRoot 抽出，行为不变。
 */
import { jsx, jsxs } from "react/jsx-runtime";

export const agentIconOptions = [{
            key: `bulb`,
            label: `灵感`
          },
          {
            key: `bot`,
            label: `机器人`
          },
          {
            key: `spark`,
            label: `火花`
          },
          {
            key: `chat`,
            label: `对话`
          },
          {
            key: `pen`,
            label: `创作`
          },
          {
            key: `vision`,
            label: `视觉`
          },
        ];

export const getAgentIconKey = (value) => {
          let normalizedKey = String(value || ``).trim().toLowerCase();
          return agentIconOptions.some((option) => option.key === normalizedKey) ? normalizedKey : `bulb`;
        };

export const renderAgentIconGlyph = (iconName, size = 18) => {
          let svgProps = {
              width: size,
              height: size,
              viewBox: `0 0 24 24`,
              fill: `none`,
              stroke: `currentColor`,
              strokeWidth: `1.85`,
              strokeLinecap: `round`,
              strokeLinejoin: `round`,
            },
            iconKey = getAgentIconKey(iconName);
          return iconKey === `bot` ?
            jsxs(`svg`, {
              ...svgProps,
              children: [
                jsx(`rect`, {
                  x: `7`,
                  y: `8`,
                  width: `10`,
                  height: `9`,
                  rx: `3`,
                }),
                jsx(`path`, {
                  d: `M12 4v2`
                }),
                jsx(`path`, {
                  d: `M9 17v2`
                }),
                jsx(`path`, {
                  d: `M15 17v2`
                }),
                jsx(`path`, {
                  d: `M7 12H5`
                }),
                jsx(`path`, {
                  d: `M19 12h-2`
                }),
                jsx(`circle`, {
                  cx: `10`,
                  cy: `12`,
                  r: `1`
                }),
                jsx(`circle`, {
                  cx: `14`,
                  cy: `12`,
                  r: `1`
                }),
                jsx(`path`, {
                  d: `M10 15h4`
                }),
              ],
            }) :
            iconKey === `spark` ?
            jsxs(`svg`, {
              ...svgProps,
              children: [
                jsx(`path`, {
                  d: `M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z`,
                }),
                jsx(`path`, {
                  d: `M18.5 4.5l.6 1.5 1.4.6-1.4.6-.6 1.5-.6-1.5-1.4-.6 1.4-.6.6-1.5Z`
                }),
                jsx(`path`, {
                  d: `M6 15.5l.8 2 .8-2 2-.8-2-.8-.8-2-.8 2-2 .8 2 .8Z`
                }),
              ],
            }) :
            iconKey === `chat` ?
            jsxs(`svg`, {
              ...svgProps,
              children: [
                jsx(`path`, {
                  d: `M6 7.5c0-1.38 1.12-2.5 2.5-2.5h7c1.38 0 2.5 1.12 2.5 2.5v4c0 1.38-1.12 2.5-2.5 2.5h-4l-3.5 3v-3H8.5A2.5 2.5 0 0 1 6 11.5v-4Z`,
                }),
                jsx(`path`, {
                  d: `M9.5 9.5h5`
                }),
                jsx(`path`, {
                  d: `M9.5 12h3.5`
                }),
              ],
            }) :
            iconKey === `pen` ?
            jsxs(`svg`, {
              ...svgProps,
              children: [
                jsx(`path`, {
                  d: `M6.5 16.5 5 19l2.5-1.5L17 8a1.8 1.8 0 1 0-2.5-2.5l-8 8Z`,
                }),
                jsx(`path`, {
                  d: `M13.5 6.5 17 10`
                }),
                jsx(`path`, {
                  d: `M8 18h8`
                }),
              ],
            }) :
            iconKey === `vision` ?
            jsxs(`svg`, {
              ...svgProps,
              children: [
                jsx(`path`, {
                  d: `M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z`,
                }),
                jsx(`circle`, {
                  cx: `12`,
                  cy: `12`,
                  r: `2.5`
                }),
                jsx(`path`, {
                  d: `M12 5V3`
                }),
              ],
            }) :
            jsxs(`svg`, {
              ...svgProps,
              children: [
                jsx(`path`, {
                  d: `M9 18h6`,
                }),
                jsx(`path`, {
                  d: `M10 21h4`,
                }),
                jsx(`path`, {
                  d: `M8.2 13.7A6 6 0 1 1 15.8 13.7C14.8 14.5 14 15.4 14 16.5h-4c0-1.1-.8-2-1.8-2.8Z`,
                }),
              ],
            });
        };

export const renderAgentIconSurface = (props2, props: any = {}) => {
          let size = props.size || 40,
            iconSize = props.iconSize || Math.max(16, Math.round(size * 0.46)),
            className = props.className || ``,
            iconClassName = props.iconClassName || ``;
          return jsx(`div`, {
            className: className,
            children: jsx(`div`, {
              className: `flex items-center justify-center text-current ${iconClassName}`,
              children: renderAgentIconGlyph(props2, iconSize),
            }),
          });
        };

export const agentChatRailMaxWidth = `min(100%, 1320px)`;

export const agentChatOuterPadding = `clamp(24px, 4vw, 72px)`;

export const agentChatRailStyle = {
          width: `100%`,
          maxWidth: agentChatRailMaxWidth,
          margin: `0 auto`,
        };

export const agentMessagesScrollStyle = {
	          display: `flex`,
	          flexDirection: `column`,
	          alignItems: `center`,
	          gap: `32px`,
		          padding: `32px ${agentChatOuterPadding} 250px`,
	        };

export const buildKnowledgeChunks = (text, chunkSize = 1200) => {
          let normalizedText = String(text || ``)
            .replace(/\r\n/g, `\n`)
            .replace(/\n{3,}/g, `\n\n`)
            .trim(),
            paragraphs = normalizedText ?
            normalizedText
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean) :
            [],
            chunks: any[] = [],
            currentChunk = ``;
          for (let paragraph of paragraphs)
            if (paragraph.length <= chunkSize)
              currentChunk.length + paragraph.length + 2 <= chunkSize ?
              (currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph) :
              (currentChunk && chunks.push(currentChunk), (currentChunk = paragraph));
            else {
              currentChunk && (chunks.push(currentChunk), (currentChunk = ``));
              for (let offset = 0; offset < paragraph.length; offset += chunkSize) chunks.push(paragraph.slice(offset, offset + chunkSize));
            }
          currentChunk && chunks.push(currentChunk);
          return chunks.map((chunk, index) => ({
            id: `chunk-${index + 1}`,
            index: index,
            text: chunk,
            size: chunk.length,
          }));
        };

export const tokenizeKnowledgeQuery = (query) =>
        Array.from(
          new Set(
            (String(query || ``).toLowerCase().match(/[\u4e00-\u9fa5]{1,}|[a-z0-9]{2,}/g) || []).filter(Boolean),
          ),
        );

export const selectKnowledgeChunksForQuery = (knowledgeFiles, query, maxChars = 6e3, maxResults = 6) => {
          let queryTokens = tokenizeKnowledgeQuery(query),
            matches = [];
          for (let file of knowledgeFiles || []) {
            let chunks = Array.isArray(file?.chunks) && file.chunks.length ?
              file.chunks :
              file?.content ?
              buildKnowledgeChunks(file.content) :
              [];
            for (let chunk of chunks) {
              let chunkText = String(chunk?.text || ``).toLowerCase(),
                score = 0;
              for (let token of queryTokens) chunkText.includes(token) && (score += token.length > 1 ? 2 : 1);
              matches.push({
                fileName: file?.name || `未命名文件`,
                text: String(chunk?.text || ``),
                score: score,
                index: Number(chunk?.index || 0),
              });
            }
          }
          matches.sort((matchA, matchB) =>
            matchB.score !== matchA.score ? matchB.score - matchA.score : matchA.index - matchB.index,
          );
          let results = [],
            charCount = 0;
          for (let match of matches) {
            if (results.length >= maxResults) break;
            if (!match.text) continue;
            let textLength = match.text.length;
            if (charCount > 0 && charCount + textLength > maxChars) continue;
            results.push(match), (charCount += textLength);
          }
          if (results.length === 0)
            for (let match of matches) {
              if (results.length >= maxResults) break;
              let textLength = match.text.length;
              if (charCount > 0 && charCount + textLength > maxChars) continue;
              results.push(match), (charCount += textLength);
            }
          return results;
        };

export const releaseAgentAttachment = (attachment) => {
            try {
              typeof attachment?.url == `string` &&
                attachment.url.startsWith(`blob:`) &&
                URL.revokeObjectURL(attachment.url);
            } catch {}
          };

export const getAgentAttachmentKind = (attachment: any = {}) => {
	            let attachmentType = String(attachment.type || ``).toLowerCase(),
	              mimeType = String(attachment.mime || ``).toLowerCase(),
	              fileName = String(attachment.name || ``).toLowerCase();
	            return attachmentType === `image` || mimeType.startsWith(`image/`) || /\.(png|jpe?g|webp|gif|heic|avif)$/i.test(fileName) ?
	              `image` :
	              attachmentType === `video` || mimeType.startsWith(`video/`) || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(fileName) ?
	              `video` :
	              attachmentType === `document` ||
	              mimeType.startsWith(`text/`) ||
	              /pdf|word|document|sheet|presentation|markdown|csv|json/.test(mimeType) ||
	              /\.(pdf|txt|md|docx?|xlsx?|pptx?|csv|json|rtf)$/i.test(fileName) ?
	              `document` :
	              `file`;
	          };

export const getAgentAttachmentMeta = (attachment: any = {}) => {
	            let attachmentKind = getAgentAttachmentKind(attachment);
	            return attachmentKind === `image` ? {
	                label: `图片`,
	                icon: `image`,
	                tint: `#22c55e`,
	                bg: `rgba(34,197,94,0.14)`,
	              } :
	              attachmentKind === `video` ? {
	                label: `视频`,
	                icon: `play`,
	                tint: `#60a5fa`,
	                bg: `rgba(96,165,250,0.16)`,
	              } :
	              attachmentKind === `document` ? {
	                label: `文档`,
	                icon: `doc`,
	                tint: `#f59e0b`,
	                bg: `rgba(245,158,11,0.16)`,
	              } : {
	                label: `文件`,
	                icon: `file`,
	                tint: `#a78bfa`,
	                bg: `rgba(167,139,250,0.16)`,
	              };
	          };

export const formatAgentAttachmentSize = (bytes) => {
	            let bytes2 = Number(bytes) || 0;
	            return bytes2 <= 0 ? `` : bytes2 < 1024 * 1024 ? `${Math.max(1, Math.round(bytes2 / 1024))} KB` : `${(bytes2 / 1024 / 1024).toFixed(bytes2 < 10 * 1024 * 1024 ? 1 : 0)} MB`;
	          };

export const renderAgentAttachmentGlyph = (attachment, options: any = {}) => {
	            let attachmentMeta = getAgentAttachmentMeta(attachment),
	              iconSize = options.size || 18;
	            return attachmentMeta.icon === `image` ?
	              jsxs(`svg`, {
	                width: iconSize,
	                height: iconSize,
	                viewBox: `0 0 24 24`,
	                fill: `none`,
	                stroke: `currentColor`,
	                strokeWidth: `2`,
	                strokeLinecap: `round`,
	                strokeLinejoin: `round`,
	                children: [
	                  jsx(`rect`, {
	                    x: `3`,
	                    y: `4`,
	                    width: `18`,
	                    height: `16`,
	                    rx: `3`,
	                  }),
	                  jsx(`circle`, {
	                    cx: `8.5`,
	                    cy: `9`,
	                    r: `1.5`,
	                  }),
	                  jsx(`path`, {
	                    d: `M21 16l-5-5-4 4-2-2-5 5`,
	                  }),
	                ],
	              }) :
	              attachmentMeta.icon === `play` ?
	              jsxs(`svg`, {
	                width: iconSize,
	                height: iconSize,
	                viewBox: `0 0 24 24`,
	                fill: `none`,
	                stroke: `currentColor`,
	                strokeWidth: `2`,
	                strokeLinecap: `round`,
	                strokeLinejoin: `round`,
	                children: [
	                  jsx(`rect`, {
	                    x: `3`,
	                    y: `5`,
	                    width: `18`,
	                    height: `14`,
	                    rx: `3`,
	                  }),
	                  jsx(`path`, {
	                    d: `M10 9.5v5l4-2.5-4-2.5z`,
	                    fill: `currentColor`,
	                    stroke: `none`,
	                  }),
	                ],
	              }) :
	              attachmentMeta.icon === `doc` ?
	              jsxs(`svg`, {
	                width: iconSize,
	                height: iconSize,
	                viewBox: `0 0 24 24`,
	                fill: `none`,
	                stroke: `currentColor`,
	                strokeWidth: `2`,
	                strokeLinecap: `round`,
	                strokeLinejoin: `round`,
	                children: [
	                  jsx(`path`, {
	                    d: `M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z`,
	                  }),
	                  jsx(`path`, {
	                    d: `M14 3v5h5`,
	                  }),
	                  jsx(`path`, {
	                    d: `M8 13h8M8 17h5`,
	                  }),
	                ],
	              }) :
	              jsxs(`svg`, {
	                width: iconSize,
	                height: iconSize,
	                viewBox: `0 0 24 24`,
	                fill: `none`,
	                stroke: `currentColor`,
	                strokeWidth: `2`,
	                strokeLinecap: `round`,
	                strokeLinejoin: `round`,
	                children: [
	                  jsx(`path`, {
	                    d: `M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z`,
	                  }),
	                  jsx(`path`, {
	                    d: `M14 2v6h6`,
	                  }),
	                ],
	              });
	          };

export const readAgentAttachmentFileAsDataUrl = (attachment) =>
	            new Promise((resolve, reject) => {
	              let file = attachment?.file;
	              if (!file || typeof FileReader > `u`) {
	                reject(Error(`没有可读取的原始参考文件`));
	                return;
	              }
	              let reader = new FileReader();
	              reader.onload = () => {
	                let dataUrl = String(reader.result || ``),
	                  mimeType =
	                  String(attachment?.mime || file.type || ``).trim() ||
	                  (attachment?.type === `image` ?
	                    `image/png` :
	                    attachment?.type === `video` ?
	                    `video/mp4` :
	                    `application/octet-stream`),
	                  match = dataUrl.match(/^data:([^;,]*)(;base64)?,(.*)$/s);
	                resolve(match && !(match[1] || ``).trim() ? `data:${mimeType}${match[2] || `;base64`},${match[3] || ``}` : dataUrl);
	              };
	              reader.onerror = () => reject(reader.error || Error(`参考文件读取失败`));
	              reader.readAsDataURL(file);
	            });

export const sanitizeAgentConversationText = (conversationText) =>
	            String(conversationText || ``).replace(/blob:https?:\/\/[^\\s'")，。；;]+/gi, `[本地临时视频地址]`);

export const formatAgentTime = (timestamp) => {
              if (!timestamp) return `刚刚`;
              let elapsedMs = Date.now() - Number(timestamp);
              if (elapsedMs < 6e4) return `刚刚`;
              if (elapsedMs < 36e5) return `${Math.max(1, Math.floor(elapsedMs / 6e4))}分钟前`;
              if (elapsedMs < 864e5) return `${Math.max(1, Math.floor(elapsedMs / 36e5))}小时前`;
              return `${Math.max(1, Math.floor(elapsedMs / 864e5))}天前`;
            };

export const getAgentOptionList = (agents) =>
    Array.isArray(agents) ?
    agents
    .filter((item) => item && typeof item == `object` && item.id)
    .map((agent, index) => ({
      id: agent.id,
      name: agent.name || agent.title || agent.label || `未命名智能体 ${index + 1}`,
      description: agent.description || agent.systemPrompt || agent.knowledge || ``,
      model: agent.model || ``,
      updatedAt: agent.updatedAt || agent.modifiedAt || agent.createdAt || 0,
    })) :
    [];

export const normalizeAgentIdSelection = (candidates, allowedValues) => {
      let matches = Array.isArray(candidates) ? candidates.filter((value) => allowedValues.includes(value)) : [];
      return matches.length ? [...new Set(matches)] : [...allowedValues];
    };
