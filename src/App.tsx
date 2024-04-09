import React, { FC, useCallback, useMemo, useState } from 'react';
import './App.less';
import { Layout, Menu, Breadcrumb, Button, Message } from '@arco-design/web-react';
import { IconHome, IconCalendar, IconCaretRight, IconCaretLeft } from '@arco-design/web-react/icon';
import { FileP } from './pages/FileP';
import { usePageState } from './PageState';
import logo from './images/logo.png';

type PageKey = 'FileP';
const pages: Record<PageKey, FC> = {
  FileP,
};
const App: FC = () => {
  const { PageStateProvider } = usePageState();
  const [collapsed, setCollapsed] = useState(false);
  const handleCollapsed = useCallback(() => setCollapsed(!collapsed), [collapsed]);
  const [activePage, setActivePage] = useState<PageKey>('FileP');
  const ActivePage = useMemo(() => pages[activePage] ?? (() => <>none</>), [activePage]);
  const children = useMemo(() => {
    return (
      <Layout className="layout-collapse-demo" style={{ height: '100%' }}>
        <Layout.Sider
          collapsed={collapsed}
          onCollapse={handleCollapsed}
          collapsible
          trigger={collapsed ? <IconCaretRight /> : <IconCaretLeft />}
          breakpoint="xl"
        >
          <div className="logo">{<img src={logo} alt="logo"></img>}</div>
          <Menu
            defaultOpenKeys={['1']}
            defaultSelectedKeys={['0_3']}
            onClickMenuItem={(key) => {
              // Message.info({
              //   content: `You select ${key}`,
              //   showIcon: true,
              // });
              setActivePage(key as PageKey);
            }}
            style={{ width: '100%' }}
          >
            <Menu.Item key="FileP">
              <IconHome />
              {'资源文件'}
            </Menu.Item>
            <Menu.SubMenu
              key="VN"
              title={
                <span>
                  <IconCalendar />
                  {'视觉小说'}
                </span>
              }
            >
              <Menu.Item key="BookP">{'脚本'}</Menu.Item>
              <Menu.Item key="CharaP">{'人物'}</Menu.Item>
            </Menu.SubMenu>
            <Menu.Item key="TipsP">{'加载页-Tips'}</Menu.Item>
            <Menu.Item key="HomeConfigP">{'首页配置'}</Menu.Item>
            <Menu.Item key="InfoP">{'首页-档案内容'}</Menu.Item>
          </Menu>
        </Layout.Sider>
        <Layout>
          <Layout.Header style={{ paddingLeft: 20 }}>{activePage}</Layout.Header>
          <Layout style={{ padding: '0 24px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              {/* <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item> */}
            </Breadcrumb>
            <Layout.Content>
              <ActivePage />
            </Layout.Content>
            <Layout.Footer>Footer</Layout.Footer>
          </Layout>
        </Layout>
      </Layout>
    );
  }, [ActivePage, activePage, collapsed, handleCollapsed]);
  return <PageStateProvider>{children}</PageStateProvider>;
};
export default App;
