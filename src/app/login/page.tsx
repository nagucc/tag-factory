import { Suspense } from 'react';
import LoginForm from './LoginForm';
import { getCASConfig } from '@/lib/config';

export default function LoginPage() {
  // 在服务端获取CAS配置
  const casConfig = getCASConfig();
  const casEnabled = casConfig.enabled && !!casConfig.serverUrl;

  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>加载中...</div>}>
      <LoginForm initialCasEnabled={casEnabled} />
    </Suspense>
  );
}
