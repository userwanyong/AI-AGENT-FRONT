// import { useEffect, useState } from 'react';

// import { Field } from '@flowgram.ai/free-layout-editor';
// import { Select } from '@douyinfe/semi-ui';

// import {
//   AiClientApiAdminService,
//   AiClientApiResponseDTO,
// } from '../../../services/ai-client-api-admin-service';
// import { useIsSidebar } from '../../../hooks';
// import { FormItem } from '../../../form-components';
// // import { ApiPort } from './styles';

// interface ApiValue {
//   key: string;
//   value: string;
// }

// export function ApiSelect() {
//   const readonly = !useIsSidebar();
//   const [apiOptions, setApiOptions] = useState<{ label: string; value: string }[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchApis = async () => {
//       setLoading(true);
//       try {
//         const apis: AiClientApiResponseDTO[] = await AiClientApiAdminService.queryEnableAiApis();
//         const options = apis.map((api) => ({
//           label: api.baseUrl,
//           value: api.id,
//         }));
//         setApiOptions(options);
//       } catch (error) {
//         console.error('获取api数据失败:', error);
//         // 设置空选项作为降级处理
//         setApiOptions([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchApis();
//   }, []);

//   return (
//     <Field<ApiValue> name="inputsValues.baseUrl.0">
//       {({ field, fieldState }) => (
//         <FormItem name="api" type="string" required={true} labelWidth={80}>
//           <Select
//             placeholder={loading ? '加载中...' : '请选择api'}
//             style={{ width: '100%' }}
//             value={field.value?.value || ''}
//             onChange={(value) =>
//               field.onChange({ key: field.value?.key || '', value: String(value || '') })
//             }
//             disabled={readonly || loading}
//             optionList={apiOptions}
//             loading={loading}
//           />
//           {/* 添加输出端口标记，使节点可以从右侧连线 */}
//           {/*<ApiPort data-port-id={field.value?.key} data-port-type="output" />*/}
//         </FormItem>
//       )}
//     </Field>
//   );
// }
