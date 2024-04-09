import { FC, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { usePageState } from '../PageState';
import _, { groupBy, update } from 'lodash';
import {
  Card,
  Skeleton,
  Dropdown,
  Menu,
  Descriptions,
  Button,
  Typography,
  Grid,
  Tag,
  Drawer,
  Table,
  TableColumnProps,
  Collapse,
  Upload,
  Message,
  Modal,
  Steps,
  Space,
  Empty,
  Image,
  Form,
  Input,
} from '@arco-design/web-react';
import { classNames, getFilesZip } from '../handle';
import { IconCheck, IconCheckCircleFill, IconCloseCircleFill, IconDoubleRight, IconFolder, IconMore, IconPlus } from '@arco-design/web-react/icon';
import { useState } from 'react';
import './FileP.less';
import Paragraph from '@arco-design/web-react/es/Typography/paragraph';
import { ModalReturnProps } from '@arco-design/web-react/es/Modal/modal';
import { KKVRecord } from '../handle/KKVRecord';
import { DBfile, dbh } from '../handle/IndexedDB';
import mime from 'mime';
const FileView: FC<{ dbFile: DBfile | void; style?: React.CSSProperties; title?: string }> = ({ dbFile, style, title }) => {
  const re = useMemo(() => {
    if (!dbFile) return <Empty />;
    const { code, fileName } = dbFile ?? {};
    const fileType = mime.lookup(fileName);
    let content = fileType.startsWith('image') ? (
      <Image src={code} className={'alpha'}></Image>
    ) : fileType.startsWith('audio') ? (
      <video controls>
        <source src={code} type={fileType} />
      </video>
    ) : (
      <iframe src={code}></iframe>
    );
    return content;
  }, [dbFile]);
  return (
    <div>
      <Title heading={6} style={{ marginTop: '4px' }}>
        {title}
      </Title>
      <Card className={classNames('file-view')} style={style}>
        {re}
      </Card>
    </div>
  );
};
const FileViewA: FC<{ fileKey?: string; dbFile?: DBfile | void; text?: string }> = ({ fileKey, dbFile, text }) => {
  if (fileKey)
    return (
      <span
        style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
        onClick={async () => {
          const dbFile: DBfile | void = await dbh.get('files', fileKey);
          Modal.info({
            title: `资源预览 - ${fileKey}`,
            content: <FileView dbFile={dbFile} />,
            style: { width: 'auto' },
          });
        }}
      >
        {text ?? `资源预览`}
      </span>
    );
  else
    return (
      <span
        style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
        onClick={async () => {
          Modal.info({
            title: `资源预览`,
            content: <FileView dbFile={dbFile} />,
            style: { width: 'auto' },
          });
        }}
      >
        {text ?? `资源预览`}
      </span>
    );
};
const FileViewCompare: FC<{ fileKey: string; dbFile: DBfile }> = ({ fileKey, dbFile }) => {
  return (
    <span
      style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
      onClick={async () => {
        const oldDBFile: DBfile | void = await dbh.get('files', fileKey);
        Modal.info({
          title: `资源比对`,
          content: (
            <div className="file-view-compare">
              <FileView dbFile={oldDBFile} title="旧 Old" />
              <IconDoubleRight style={{ fontSize: 40, strokeWidth: 5, color: 'rgb(var(--gray-5))', marginTop: '40px' }} />
              <FileView dbFile={dbFile} title="新 New" />
            </div>
          ),
          closable: true,
          style: { width: 'auto' },
        });
      }}
    >
      {'资源比对'}
    </span>
  );
};

const isAcceptFile = (file: File, accept: string) => {
  console.log(file);
  if (accept && file) {
    const accepts = Array.isArray(accept)
      ? accept
      : accept
          .split(',')
          .map((x) => x.trim())
          .filter((x) => x);
    const fileExtension = file.name.indexOf('.') > -1 ? file.name.split('.').pop() : '';
    return accepts.some((type) => {
      const text = type && type.toLowerCase();
      const fileType = (file.type || '').toLowerCase();
      if (text === fileType) {
        // 类似excel文件这种
        // 比如application/vnd.ms-excel和application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        // 本身就带有.字符的，不能走下面的.jpg等文件扩展名判断处理
        // 所以优先对比input的accept类型和文件对象的type值
        return true;
      }
      if (new RegExp('/*').test(text)) {
        // image/* 这种通配的形式处理
        const regExp = new RegExp('/.*$');
        return fileType.replace(regExp, '') === text.replace(regExp, '');
      }
      if (new RegExp('..*').test(text)) {
        // .jpg 等后缀名
        return text === `.${fileExtension && fileExtension.toLowerCase()}`;
      }
      return false;
    });
  }
};
const { Title } = Typography;
const { Row, Col } = Grid;
interface AddCardProps {
  description?: string;
}
const formItemLayout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 20,
  },
};
function AddCard(props: AddCardProps) {
  const { pageAction } = usePageState();
  const [form] = Form.useForm<{ name: string }>();
  function onOk() {
    return form.validate().then((e) => pageAction.addPackage(e.name));
  }
  return (
    <Card
      className={classNames('card-block', 'add-card')}
      title={null}
      bordered={true}
      size="small"
      onClick={() => {
        const modal = pageAction.modal.confirm!({
          title: '新建包',
          content: (
            <Form {...formItemLayout} form={form}>
              <Form.Item
                label="包名"
                field="name"
                rules={[
                  {
                    required: true,
                    validator(v, cb) {
                      // eslint-disable-next-line no-control-regex
                      if (v) {
                        const reg = /^[^\x00-\x20\\/:*?"<>|]*$/;
                        if (!reg.test(v)) {
                          cb(`不可含${'\\/:*?"<>|'.split('').join('、')},以及空格和控制字符。`);
                        } else cb(null);
                      } else cb(`请输入包名`);
                    },
                  },
                ]}
              >
                <Input maxLength={64} showWordLimit placeholder="输入新的包名称" />
              </Form.Item>
            </Form>
          ),
          onOk: () =>
            onOk().then(() => {
              form.clearFields();
              modal.close();
            }),
        });
      }}
    >
      <div className={'content'}>
        <div className={'add-icon'}>
          <IconPlus />
        </div>
        <div className={'description'}>{props.description}</div>
      </div>
    </Card>
  );
}

type packageStatus = 'default' | 'free';
type CardBlockType = {
  handleCallDrawer: (data: { type: 'manage'; packageKey: string }) => void;
  card: { status: packageStatus; data: [string, [string, [string, string]][]] };
};
const CardBlock: FC<CardBlockType> = (props) => {
  const { pageState, pageAction } = usePageState();
  const {
    card: {
      status,
      data: [packageKey, filesEntries],
    },
    handleCallDrawer,
  } = props;
  const [visible, setVisible] = useState(false);
  const getContent = () => (
    <Descriptions
      column={2}
      data={[
        { label: '文件总数', value: filesEntries.length },
        // { label: '状态', value: status },
      ]}
    />
  );

  const getButtonGroup = () => {
    return (
      <>
        <Button
          type="primary"
          style={{ marginLeft: '12px' }}
          onClick={() => {
            handleCallDrawer({ type: 'manage', packageKey });
          }}
        >
          {'管理'}
        </Button>
        <Button
          status="danger"
          style={{ marginLeft: '12px', backgroundColor: 'var(--' }}
          onClick={() => {
            pageAction.deletePackage(packageKey);
          }}
        >
          {'删除包及包内所有文件'}
        </Button>
      </>
    );
  };
  const timeText = ((dn) => {
    if (dn) {
      const d = new Date(dn);
      return `${d
        .toLocaleDateString()
        .split('/')
        .map((e, i) => (i === 0 ? e.slice(2, 4) : e.padStart(2, '0')))
        .join('/')} ${d.toLocaleTimeString()}`;
    } else return '*没有修改记录';
  })(pageState.workState.file.packagesLastModifiedDate[packageKey]);
  const getStatus = () => {
    switch (status) {
      case 'default':
        return (
          <Tag color="green" icon={<IconCheckCircleFill />} className={'status'} size="small">
            {'正常'}
          </Tag>
        );
      case 'free':
        return (
          <Tag color="red" icon={<IconCloseCircleFill />} className={'status'} size="small">
            {'游离文件'}
          </Tag>
        );
      default:
        return null;
    }
  };
  return (
    <Card
      bordered={true}
      className={classNames('card-block')}
      size="small"
      title={
        <>
          <div className={classNames('title')}>
            {<IconFolder />}
            <span style={{ marginLeft: '4px' }}>{packageKey}</span>
            {getStatus()}
            <Dropdown
              droplist={
                <Menu>
                  {['操作1', '操作2'].map((item, key) => (
                    <Menu.Item key={key.toString()}>{item}</Menu.Item>
                  ))}
                </Menu>
              }
              trigger="click"
              onVisibleChange={setVisible}
              popupVisible={visible}
            >
              <div className={'more'}>
                <IconMore />
              </div>
            </Dropdown>
          </div>
          <div className={'time'}>{timeText}</div>
        </>
      }
    >
      <div className={'content'}>{getContent()}</div>
      <div className={'extra'}>{getButtonGroup()}</div>
    </Card>
  );
};
const getStringSorter = (index: string) => (a: string, b: string) => _.get(a, index).localeCompare(_.get(b, index));

const noConflictColumns: TableColumnProps[] = [
  { title: '键(key)', dataIndex: 'key', fixed: 'left', sorter: getStringSorter('0') },
  { title: '文件名', dataIndex: 'fileName' },
  {
    title: '操作',
    headerCellStyle: { paddingLeft: '15px' },
    render(_, item) {
      return <FileViewA dbFile={item} />;
    },
  },
];
const ConflictModalInner: FC<{
  // isConflicting: boolean;
  getModal: () => ModalReturnProps;
  // conflictTableData: {
  //   type: number;
  //   data: DBfile;
  //   key: string;
  // }[];
  // conflictTableColumn: TableColumnProps[];
  packageKey: string;
  conflictGroup: _.Dictionary<DBfile[]>;
  conflictMap: Map<string, string>;
  filesCode: Record<string, string>;
  // lastClickedLineKey: string | null;
  filesKKR: KKVRecord<DBfile>;
}> = ({ conflictMap, filesKKR, getModal, packageKey, conflictGroup, filesCode }) => {
  const isConflicting = Boolean(conflictGroup[1] || conflictGroup[2] || conflictGroup[3]);
  const conflictTableColumn = useMemo<
    TableColumnProps<{
      type: number;
      data: DBfile;
      key: string;
      oldKey: string;
    }>[]
  >(
    () => [
      {
        title: '冲突类型',
        dataIndex: 'type',
        render: (v) => [v & 1 && 'key', v & 2 && 'name'].filter(Boolean).join('&'),
        sorter: (a, b) => a - b,
      },
      {
        title: '文件key',
        dataIndex: 'data.key',
        render: (v, _) => <span style={_.type & 1 ? { color: 'red' } : void 0}>{v}</span>,
        sorter: getStringSorter('data.key'),
      },
      {
        title: '文件名',
        dataIndex: 'data.fileName',
        render: (v, _) => <span style={_.type & 2 ? { color: 'red' } : void 0}>{v}</span>,
        sorter: getStringSorter('data.fileName'),
      },
      {
        title: '冲突的文件key',
        dataIndex: 'oldKey',
        render: (v, _) => (
          <div onClick={() => setLastClickedLineKey(_.key)}>
            <FileViewA fileKey={v} />
          </div>
        ),
      },
      {
        title: '比对',
        dataIndex: '["oldKey"]',
        render: (v, _) => (
          <div onClick={() => setLastClickedLineKey(_.key)}>
            <FileViewCompare fileKey={v} dbFile={_.data} />
          </div>
        ),
      },
    ],
    []
  );
  const conflictTableData = useMemo<
    {
      type: number;
      data: DBfile;
      key: string;
      oldKey: string;
    }[]
  >(() => [1, 2, 3].map((i) => conflictGroup[i]?.map((e) => ({ type: i, data: e, key: e.key, oldKey: conflictMap.get(e.key)! })) ?? []).flat(1), []);
  const { pageAction } = usePageState();
  const [lastClickedLineKey, setLastClickedLineKey] = useState<string | null>(null);
  // const [currentStep, setCurrentStep] = useState<1 | 2>(isConflicting ? 1 : 2);
  const [_selectedRowKeys, _setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [__selectedRowKeys, __setSelectedRowKeys] = useState<(string | number)[]>((conflictGroup[0] ?? []).map((e) => e.key));
  // useEffect(() => {
  //   if (currentStep === 2) getModal().update({ okButtonProps: { disabled: false }, okText: '确认' });
  // }, [currentStep, getModal]);
  const [loading, setLoading] = useState(false);
  return (
    <Space direction="vertical">
      {/* <div style={{ padding: '16px 0' }}>
        <Steps size="small" current={currentStep} style={{ maxWidth: 600, margin: '0 auto' }}>
          <Steps.Step title="选择覆盖/重传" />
          <Steps.Step title="确认结果" />
        </Steps>
      </div> */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
        {isConflicting && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title heading={6}>检查到{conflictTableData.length}项冲突！</Title>
              <Paragraph>你可以修改包后重新上传，或表格内选择需要覆盖已有文件记录的文件项。未被选择的文件项不会生效。</Paragraph>
              <Space direction="horizontal" style={{ float: 'right' }} size={'medium'}>
                <span style={{ fontWeight: 'bold' }}>已选 {_selectedRowKeys.length} 项</span>
                <Button onClick={() => _setSelectedRowKeys(conflictTableData.map((e: { key: any }) => e.key))} type="primary">
                  全选
                </Button>
                <Button onClick={() => _setSelectedRowKeys([])} type="outline">
                  全不选
                </Button>
              </Space>
              <Table
                data={conflictTableData}
                stripe
                columns={conflictTableColumn}
                rowClassName={(item) => (item.key === lastClickedLineKey ? 'last-clicked' : '')}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: _selectedRowKeys,
                  checkCrossPage: true,
                  onChange: (selectedRowKeys, selectedRows) => {
                    _setSelectedRowKeys(selectedRowKeys);
                  },
                }}
                pagination={{ hideOnSinglePage: true, pageSize: 10 }}
              ></Table>
              {/* <Space direction="horizontal" style={{ float: 'right' }} size={'medium'}>
                <Button onClick={() => setCurrentStep(2)}>下一步</Button>
              </Space> */}
            </Space>
          </Card>
        )}

        {conflictGroup[0] && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title heading={6}>新增 {__selectedRowKeys.length} 项</Title>
              <Space direction="horizontal" style={{ float: 'right' }} size={'medium'}>
                <Button onClick={() => __setSelectedRowKeys(conflictGroup[0].map((e: { key: any }) => e.key))} type="primary">
                  全选
                </Button>
                <Button onClick={() => __setSelectedRowKeys([])} type="outline">
                  全不选
                </Button>
              </Space>
              <Table
                data={conflictGroup[0]}
                columns={noConflictColumns}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: __selectedRowKeys,
                  checkCrossPage: true,
                  onChange: (selectedRowKeys, selectedRows) => {
                    __setSelectedRowKeys(selectedRowKeys);
                  },
                }}
              ></Table>
            </Space>
          </Card>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* <Button onClick={() => setCurrentStep(1)} disabled={!isConflicting}>
                  上一步
                </Button> */}
        <Title heading={6} style={{ marginBlock: '6px' }}>
          修改内容确认: 共新增 {__selectedRowKeys.length} 项，替换 {_selectedRowKeys.length} 项。
        </Title>
        <Button
          onClick={async () => {
            setLoading(true);
            const selectedKeys = _selectedRowKeys;
            const deleteKeys = selectedKeys.map((e) => conflictMap.get(e.toString())!);
            pageAction.deleteFiles(deleteKeys);
            await pageAction.addFiles(packageKey, [...(conflictGroup[0] ?? []), ..._selectedRowKeys.map((e) => filesKKR[e])], true);
            getModal().close();
          }}
          loading={loading}
          style={{ marginLeft: '16px' }}
          type="primary"
        >
          应用
        </Button>
      </div>
    </Space>
  );
};

export const FileP: FC = () => {
  const { pageState, pageAction } = usePageState();
  // a 文件信息按packageKey分组
  type aItem = [string, [string, string]];
  type aItemList = aItem[];
  const a: Record<string, aItemList> = _.groupBy(Object.entries(pageState.data.file), (e) => e[1][0]);
  // b 已创建的包匹配a属性
  const b: [string, aItemList][] = Object.keys(pageState.data.packagePath).map((e) => {
    const re: [string, aItemList] = [e, a[e] ?? []];
    delete a[e];
    return re;
  });
  type cItem = {
    status: packageStatus;
    data: [string, aItemList];
  };
  const c: cItem[] = [
    ...b.map<cItem>((e) => ({ status: 'default', data: e })),
    ...Object.entries(a).map<cItem>((e) => ({ status: 'free', data: e })),
  ];

  const [visible, setVisible] = useState(false);
  const [drawerData, setDrawerData] = useState<{
    type: 'manage';
    packageKey: string;
  }>(null!);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(['0']);

  const handleCallDrawer = (data: typeof drawerData) => {
    setVisible(true);
    setDrawerData(data);
  };
  const handleCloseDrawer = () => setVisible(false);
  const handleCallCustomRequestModalRef = useRef<(() => void) | null>(null);

  const [pageSize, setPageSize] = useState(20);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  useEffect(() => {
    pageAction.cleanPreviewCache();
  }, [currentPageNumber]);
  const getDrawerInner = () => {
    if (!drawerData) return <Empty />;
    const packageViewColumns: TableColumnProps[] = [
      { title: '键(key)', dataIndex: '0', fixed: 'left', sorter: getStringSorter('0') },
      { title: '文件名', dataIndex: '[1][1]' },
      {
        title: '操作',
        headerCellStyle: { paddingLeft: '15px' },
        render(_, item, index) {
          return (
            <Button
              type="text"
              size="small"
              onClick={() =>
                pageAction.callPreview(
                  currentPage.map((e) => e[0]),
                  index
                )
              }
            >{`预览`}</Button>
          );
        },
      },
    ];
    const { type, packageKey } = drawerData;
    const find_cItem = c.find((e) => e.data[0] === packageKey);
    const data = (_.get(find_cItem, 'data[1]') ?? []) as aItemList;
    const packageViewData = data;
    const currentPage = packageViewData.slice((currentPageNumber - 1) * pageSize, currentPageNumber * pageSize);
    const filesKeySet = new Set(data.map((e) => e[0]));
    const filesNameKeyMap = new Map(data.map((e) => [e[1][1], e[0]]));
    // console.log(filesNameKeyMap);
    return (
      <>
        <Collapse defaultActiveKey={['1']} triggerRegion="header" style={{ maxWidth: 1180 }}>
          <Collapse.Item header={`批量导入/覆盖`} name="0">
            <Upload
              multiple={false}
              limit={{
                maxCount: 1,
                hideOnExceedLimit: false,
              }}
              progressProps={{
                size: 'small',
                type: 'line',
                showText: true,
                width: '100%',
                formatText(percent) {
                  return percent.toString();
                },
              }}
              showUploadList={{ successIcon: <IconCheck onClick={() => handleCallCustomRequestModalRef.current?.()} /> }}
              accept={{ type: 'application/x-zip-compressed', strict: false }}
              customRequest={async (option) => {
                const { onProgress, onError, onSuccess, file } = option;
                if (isAcceptFile(file, 'application/x-zip-compressed')) {
                  const filesCode = await getFilesZip(file, (done: number, total: number | null) =>
                    onProgress(
                      // (done / total) * 100
                      {
                        toString: () => {
                          if (total === null) return '...';
                          return `${done}/${total}`;
                        },
                        valueOf: () => {
                          if (total === null) return 0;
                          if (total === 0) return 100;
                          return (done / total) * 100;
                        },
                      } as number
                    )
                  );
                  const filesKKR = new KKVRecord<DBfile>();
                  // const filesKKRCache: DBfile[] = [];
                  const conflictMap = new Map();
                  const conflictGroup = _.groupBy(
                    Object.entries(filesCode).map<DBfile>(([fileName, code]) => {
                      const pointIndex = fileName.lastIndexOf('.');
                      let key = pointIndex !== -1 ? fileName.slice(0, pointIndex) : fileName;
                      if (filesKKR[key]) {
                        let count = 1;
                        while (filesKKR[key + `#${count++}`]);
                        key = key + `#${count}`;
                      }
                      KKVRecord.push(filesKKR, [{ key, fileName, code }]);
                      return { key, fileName, code };
                    }),
                    ({ key, fileName, code }) => {
                      const keyConflict = filesKeySet.has(key);
                      const nameConflict = filesNameKeyMap.has(fileName);
                      if (keyConflict) conflictMap.set(key, key);
                      else if (nameConflict) conflictMap.set(key, filesNameKeyMap.get(fileName));
                      return (keyConflict ? 1 : 0) + (nameConflict ? 2 : 0);
                      // 0 no
                      // 1 key
                      // 2 name
                      // 3 key&name
                    }
                  );
                  console.log(conflictGroup, conflictMap);

                  //解决冲突
                  const modal = (handleCallCustomRequestModalRef.current = () =>
                    pageAction.modal.info!({
                      content: (
                        <ConflictModalInner
                          {...{
                            getModal: () => modal,
                            packageKey,
                            conflictGroup,
                            conflictMap,
                            filesCode,
                            filesKKR,
                          }}
                        />
                      ),
                      maskClosable: false,
                      closable: true,
                      okButtonProps: { disabled: false },
                      footer: null,
                      title: '上传结果确认',
                      style: { maxHeight: '90vh', minHeight: '60vh', maxWidth: '90vw', width: 'auto', overflow: 'auto' },
                    }))();
                  // }
                  onSuccess();
                  return;
                } else {
                  onError(['不接受的文件类型，请重新上传指定文件类型~']);
                  Message.info('不接受的文件类型，请重新上传指定文件类型~');
                }
              }}
              onChange={(_, e) => {
                console.log(e);
              }}
            />
          </Collapse.Item>
          <Collapse.Item header={`${packageKey} 当前内容 ${packageViewData.length}`} name="1">
            <Table
              columns={packageViewColumns}
              rowKey={'0'}
              data={packageViewData}
              size="mini"
              stripe
              pagination={{ pageSize: pageSize, onChange: (i) => setCurrentPageNumber(i), current: currentPageNumber }}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                checkCrossPage: true,
                onChange: (selectedRowKeys, selectedRows) => {
                  console.log(selectedRowKeys);
                  setSelectedRowKeys(selectedRowKeys);
                },
              }}
            ></Table>
          </Collapse.Item>
        </Collapse>
      </>
    );
  };
  return (
    <Card>
      <Title heading={6}>{'menu.list.card'}</Title>
      <Row gutter={24} className={'card-content'}>
        {
          <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6}>
            <AddCard description={'cardList.add.quality'} />
          </Col>
        }
        {c.map((item, index) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} key={index}>
            <CardBlock card={item} handleCallDrawer={handleCallDrawer} />
          </Col>
        ))}
      </Row>
      <Drawer
        maskClosable={false}
        title={<span>包管理</span>}
        width={660}
        visible={visible}
        afterClose={() => {
          setDrawerData(null!);
          handleCallCustomRequestModalRef.current = null;
        }}
        onCancel={handleCloseDrawer}
        onOk={handleCloseDrawer}
      >
        {getDrawerInner()}
      </Drawer>
    </Card>
  );
};
