/**
 * getProjectMediaPayload。自 bundle 抽出，逐字搬运、行为不变。
 */
import { useCallback, useMemo } from "react";
import { isProjectMediaExternalReference } from "../lib/backup";

interface UseGetProjectMediaPayloadDeps {
  projectMediaStringToPortableValue: any;
}

export function use_getProjectMediaPayload(deps: UseGetProjectMediaPayloadDeps) {
  const {
    projectMediaStringToPortableValue,
  } = deps;
  const getProjectMediaPayload = async (node, bindingKey, value) => {
                    if (
                      bindingKey === `resultData` && [`image`, `video`, `audio`].includes(node?.data?.config?.outputType)
                    )
                      return null;
                    if (bindingKey === `text` || bindingKey === `resultData`) {
                      if (value === undefined || value === null || value === ``) return null;
                      let textValue =
                        typeof value == `string` ?
                        value :
                        typeof value == `object` ?
                        JSON.stringify(value, null, 2) :
                        String(value),
                        format =
                        typeof value == `object` && value !== null && !Array.isArray(value) ?
                        `json` :
                        `text`;
                      return {
                        portableValue: textValue,
                        persistPayload: {
                          text: textValue,
                          mime: format === `json` ? `application/json` : `text/plain`,
                          filename: bindingKey === `resultData` ?
                            `${node.type || `node`}-result.${format === `json` ? `json` : `txt`}` :
                            `${node.type || `node`}-text.txt`,
                        },
                        valueFormat: format,
                      };
                    }
                    if (typeof value != `string` || !value) return null;
                    let portableValue = await projectMediaStringToPortableValue(value);
                    if (portableValue === value && isProjectMediaExternalReference(value)) return null;
                    return {
                      portableValue: portableValue,
                      persistPayload: {
                        url: portableValue,
                        filename: `${node.type || `node`}-${bindingKey}`,
                      },
                      valueFormat: `data-url`,
                    };
                  };
  return { getProjectMediaPayload };
}
