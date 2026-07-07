/**
 * 项目/资源集合的规范化：项目分组、模块选择、项目ID选择、项目资源映射。
 * 自 bundle 反混淆迁出，行为保持一致。
 */
import { mergeTransitResourceEntries } from "./app-root-helpers";

export const normalizeProjectGroups = (rawGroups) =>
        Array.isArray(rawGroups) ?
        rawGroups
        .filter((group) => group && typeof group == `object`)
        .map((group, index) => ({
          id: String(group.id || `group-${Date.now()}-${index}`),
          name: String(group.name || `未命名分组`).trim() || `未命名分组`,
          collapsed: !!group.collapsed,
          order: Number.isFinite(Number(group.order)) ? Number(group.order) : index,
        }))
        .sort((firstGroup, secondGroup) => (firstGroup.order || 0) - (secondGroup.order || 0)) :
        [];

export const normalizeModuleSelection = (list, allowedValues) => {
      let filtered = Array.isArray(list) ?
        list.filter((item) => allowedValues.includes(item)) :
        [];
      return filtered.length ? [...new Set(filtered)] : [...allowedValues];
    };

export const normalizeProjectIdSelection = (candidates, allowedValues) => {
      let matches = Array.isArray(candidates) ? candidates.filter((value) => allowedValues.includes(value)) : [];
      return matches.length ? [...new Set(matches)] : [...allowedValues];
    };

export const normalizeProjectResourceMap = (input) => {
              let source = input && typeof input == `object` ? input : {},
                result = {};
              for (let [key, value] of Object.entries(source))
                key &&
                Array.isArray(value) &&
                value.length > 0 &&
                (result[key] = mergeTransitResourceEntries(value));
              return result;
            };
