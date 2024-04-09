import { FC, PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DBfile, dbh } from './handle/IndexedDB';
import type { CheckerConstructorProps, StoryCheckerMode } from './data/globalSave';
import { Image, Modal, ModalHookReturnType } from '@arco-design/web-react';
type PageState = {
  workState: {
    file: {
      packagesLastModifiedDate: Record<string, number>;
    };
  };
  data: {
    book: Record<string, [string, Record<string, string>]>;
    packagePath: Record<string, string>;
    file: Record<string, [string, string]>;
    chara: Record<string, [string, Record<string, string>, string]>;
    tipsGroup: Record<string, [string, ...[string, string][]]>;
    information: Record<
      string,
      {
        title: string;
        order: string;
        check: CheckerConstructorProps<StoryCheckerMode>;
        data: ['pic' | 'text', string][];
      }
    >;
    homeResource: {
      backgroundGroupList: [CheckerConstructorProps<StoryCheckerMode>, [string, string]][];
      BGM: string;
      backgroundImage: string;
      elements: {
        title: string;
        logo: string;
      };
    };
  };
};
type PageAction = {
  addPackage: (packageKey: string) => Promise<void>;
  deletePackage: (packageKey: string) => Promise<void>;
  addFiles: (packageKey: string, keyNameCodeList: DBfile[], force?: boolean) => Promise<void>;
  deleteFiles: (keys: string[]) => void;
  callPreview: (fileKeyList: string[], current?: number) => Promise<void>;
  cleanPreviewCache: () => void;
  modal: ModalHookReturnType;
};

const pageStateInit: PageState = {
  workState: {
    file: {
      packagesLastModifiedDate: { home: Date.now() },
    },
  },
  data: {
    book: {},
    packagePath: (() => {
      const fromLocal = localStorage.getItem('editor-packagePath');
      if (fromLocal === null) return {};
      try {
        return JSON.parse(fromLocal);
      } catch (e) {
        console.warn('fromLocal非json', e);
        return {};
      }
    })(),
    // {
    //   home: 'package/home.zip',
    //   voice: 'package/voice.zip',
    //   chara: 'package/chara.zip',
    //   place: 'package/place.zip',
    //   BGM: 'package/BGM.zip',
    //   CG: 'package/CG.zip',
    // },
    file: (() => {
      const fromLocal = localStorage.getItem('editor-file');
      if (fromLocal === null) return {};
      try {
        return JSON.parse(fromLocal);
      } catch (e) {
        console.warn('fromLocal非json', e);
        return {};
      }
    })(),
    // {
    //   OUT_SAMPLE: ['out', 'OUT_SAMPLE.png'],

    //   H_BGM1: ['home', 'bgm_0903_loop.ogg'],
    //   H_BGM2: ['home', 'bgm_0421_loop.ogg'],
    //   H_BG1: ['home', 'bg_2081.png'],
    //   H_BG2: ['home', 'bg_4107.png'],
    //   H_title: ['home', 'sampleA_title.png'],
    //   H_logo: ['home', 'sampleA_logo.png'],
    //   BC_SAMPLE1: ['home', 'bg_4106.png'],

    //   koe_0090: ['voice', 'aiy010100090.ogg'],
    //   koe_0100: ['voice', 'aiy010000100.ogg'],
    //   koe_0120: ['voice', 'aiy010000120.ogg'],
    //   koe_0160: ['voice', 'aiy010000160.ogg'],
    //   koe_0180: ['voice', 'aiy010000180.ogg'],
    //   koe_0300: ['voice', 'aiy120100300.ogg'],
    //   koe_0310: ['voice', 'aiy010000310.ogg'],
    //   koe_0960: ['voice', 'aiy120000960.ogg'],
    //   koe_1110: ['voice', 'aiy010101110.ogg'],
    //   koe_1140: ['voice', 'aiy010401140.ogg'],
    //   koe_1450: ['voice', 'aiy010001450.ogg'],
    //   koe_1500: ['voice', 'aiy120001500.ogg'],
    //   koe_1520: ['voice', 'aiy120001520.ogg'],
    //   koe_1640: ['voice', 'aiy010001640.ogg'],
    //   koe_1710: ['voice', 'aiy010001710.ogg'],
    //   koe_1740: ['voice', 'aiy010001740.ogg'],
    //   koe_1760: ['voice', 'aiy010001760.ogg'],
    //   koe_1780: ['voice', 'aiy010401780.ogg'],
    //   koe_1790: ['voice', 'aiy010001790.ogg'],
    //   koe_1800: ['voice', 'aiy010001800.ogg'],
    //   koe_1830: ['voice', 'aiy010301830.ogg'],
    //   koe_1880: ['voice', 'aiy010001880.ogg'],
    //   koe_1970: ['voice', 'aiy010001970.ogg'],
    //   koe_1980: ['voice', 'aiy010001980.ogg'],
    //   koe_2020: ['voice', 'aiy010002020.ogg'],
    //   koe_2030: ['voice', 'aiy010002030.ogg'],
    //   koe_2250: ['voice', 'aiy010502250.ogg'],
    //   koe_2580: ['voice', 'aiy010502580.ogg'],
    //   koe_3110: ['voice', 'aiy010703110.ogg'],
    //   koe_3610: ['voice', 'aiy010303610.ogg'],
    //   koe_8115: ['voice', '8115.ogg'],

    //   tati_010306: ['chara', 'tati_010306.png'],
    //   tati_010310: ['chara', 'tati_010310.png'],
    //   tati_010324: ['chara', 'tati_010324.png'],
    //   tati_010327: ['chara', 'tati_010327.png'],
    //   tati_010330: ['chara', 'tati_010330.png'],
    //   tati_010331: ['chara', 'tati_010331.png'],
    //   tati_010332: ['chara', 'tati_010332.png'],
    //   tati_010342: ['chara', 'tati_010342.png'],
    //   tati_010355: ['chara', 'tati_010355.png'],
    //   tati_040402: ['chara', 'tati_040402.png'],
    //   tati_040403: ['chara', 'tati_040403.png'],
    //   tati_040404: ['chara', 'tati_040404.png'],
    //   tati_040405: ['chara', 'tati_040405.png'],
    //   tati_040406: ['chara', 'tati_040406.png'],
    //   tati_040407: ['chara', 'tati_040407.png'],
    //   tati_040412: ['chara', 'tati_040412.png'],
    //   tati_040413: ['chara', 'tati_040413.png'],
    //   tati_040421: ['chara', 'tati_040421.png'],
    //   tati_040422: ['chara', 'tati_040422.png'],
    //   tati_040423: ['chara', 'tati_040423.png'],
    //   tati_040425: ['chara', 'tati_040425.png'],
    //   tati_040427: ['chara', 'tati_040427.png'],
    //   tati_040431: ['chara', 'tati_040431.png'],
    //   tati_040432: ['chara', 'tati_040432.png'],
    //   tati_040433: ['chara', 'tati_040433.png'],
    //   tati_040441: ['chara', 'tati_040441.png'],
    //   tati_040442: ['chara', 'tati_040442.png'],
    //   tati_040443: ['chara', 'tati_040443.png'],
    //   tati_040444: ['chara', 'tati_040444.png'],
    //   tati_040445: ['chara', 'tati_040445.png'],
    //   tati_040450: ['chara', 'tati_040450.png'],
    //   tati_040454: ['chara', 'tati_040454.png'],
    //   tati_040455: ['chara', 'tati_040455.png'],
    //   tati_040456: ['chara', 'tati_040456.png'],
    //   tati_z010324: ['chara', 'tati_z010324.png'],
    //   tati_z040402: ['chara', 'tati_z040402.png'],

    //   bg_3522: ['place', 'bg_3522.png'],
    //   bg_3551: ['place', 'bg_3551.png'],
    //   bg_3602: ['place', 'bg_3602.png'],

    //   bgm_0301: ['BGM', 'bgm_0301_loop.ogg'],
    //   bgm_0302: ['BGM', 'bgm_0302_loop.ogg'],
    //   bgm_0910: ['BGM', 'bgm_0910_loop.ogg'],

    //   mon_010101: ['CG', 'mon_010101.png'],
    //   mon_030101: ['CG', 'mon_030101.png'],
    // },
    chara: {},
    tipsGroup: {},
    information: {},
    homeResource: {
      backgroundGroupList: [],
      BGM: '',
      backgroundImage: '',
      elements: {
        title: '',
        logo: '',
      },
    },
  },
};
const pageStateContext = createContext(pageStateInit);
const pageActionContext = createContext({} as PageAction);
export const PageStateProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  const [modal, contextHolder] = Modal.useModal();
  //   const [file, fileSetter] = useState<PageState["data"]["file"]>({});

  // 用proxy代替{...}刷新,得到更好的刷新性能（牺牲读写）
  // 但是为什么不用Map呢？
  // 但是为什么不用forceUpdate呢？
  const _workState = pageStateInit.workState;
  const [workState, refreshWorkState] = useReducer(() => {
    localStorage.setItem('work-state', JSON.stringify(_workState));
    return new Proxy(pageStateInit.workState, {});
  }, _workState);

  const _file = pageStateInit.data.file;
  const [file, refreshFile] = useReducer(() => {
    localStorage.setItem('editor-file', JSON.stringify(_file));
    return new Proxy(pageStateInit.data.file, {});
  }, _file);

  const _packagePath = pageStateInit.data.packagePath;
  const [packagePath, refreshPackagePath] = useReducer(() => {
    localStorage.setItem('editor-packagePath', JSON.stringify(_packagePath));
    return new Proxy(pageStateInit.data.packagePath, {});
  }, _packagePath);

  const pageState: PageState = {
    workState: workState,
    data: {
      book: {},
      packagePath,
      file,
      chara: {},
      tipsGroup: {},
      information: {},
      homeResource: {
        backgroundGroupList: [],
        BGM: '',
        backgroundImage: '',
        elements: {
          title: '',
          logo: '',
        },
      },
    },
  };
  useEffect(() => {
    (async () => {
      const data = dbh.getAll('data');
      const workState = localStorage.getItem('workState');
      // 恢复状态
    })();
  }, []);
  const addPackage = useCallback(async (packageKey: string) => {
    _packagePath[packageKey] = `package/${packageKey}.zip`;
    refreshPackagePath();
  }, []);
  const deletePackage = useCallback(async (packageKey: string) => {
    const fileKeyList = Object.entries(_file)
      .filter((e) => e[1][0] === packageKey)
      .map((e) => e[0]);
    await dbh.deleteM('files', fileKeyList);
    fileKeyList.forEach((key) => {
      delete _file[key];
    });
    delete _packagePath[packageKey];
    refreshFile();
    refreshPackagePath();
  }, []);
  const addFiles = useCallback(async (packageKey: string, DBfileList: DBfile[], force?: boolean) => {
    if (!force) {
      const conflict = DBfileList.find(({ key }) => _file[key]);
      if (conflict) throw new Error(`新增文件Key与已有Key冲突(key: ${conflict.key})`);
    }
    await dbh.putM('files', DBfileList);
    DBfileList.forEach(({ key, fileName }) => {
      _file[key] = [packageKey, fileName];
    });
    refreshFile();
  }, []);
  const deleteFiles = useCallback((keys: string[]) => {
    keys.forEach((key) => {
      delete _file[key];
    });
    refreshFile();
  }, []);

  const [imagePreviewVisiable, setImagePreviewVisiable] = useState(false);
  const previewSrcRecordRef = useRef<{ cachedFileKeySet: Set<string>; srcRecord: Record<string, string> }>({
    cachedFileKeySet: new Set([]),
    srcRecord: {},
  });
  const [previewGroupCurrent, setPreviewGroupCurrent] = useState<number>(0);
  const callPreview = useCallback(async (fileKeyList: string[], current?: number) => {
    // setImagePreviewVisiable(true);
    if (current !== void 0) setPreviewGroupCurrent(current);
    const { srcRecord, cachedFileKeySet } = previewSrcRecordRef.current;
    const needList = fileKeyList.filter((e) => !cachedFileKeySet.has(e));
    if (needList.length) {
      (await dbh.getM('files', needList)).forEach((dbfile: DBfile | void, i: number) => {
        if (dbfile === void 0) {
          console.warn(`callPreview(): 获取文件记录失败(${needList[i]})`);
          return;
        }
        const { key, code } = dbfile;
        srcRecord[key] = code;
      });
      needList.forEach((e) => cachedFileKeySet.add(e));
    }
    setImagePreviewVisiable(true);
    return;
  }, []);
  const cleanPreviewCache = useCallback(() => {
    const { srcRecord, cachedFileKeySet } = previewSrcRecordRef.current;
    Object.keys(srcRecord).forEach((e) => {
      delete srcRecord[e];
    });
    cachedFileKeySet.clear();
    setImagePreviewVisiable(false);
  }, []);
  const pageAction: PageAction = { addPackage, deletePackage, addFiles, deleteFiles, callPreview, cleanPreviewCache, modal };
  return (
    <pageStateContext.Provider value={pageState}>
      <pageActionContext.Provider value={pageAction}>
        {children}
        {contextHolder}
        <Image.PreviewGroup
          srcList={Object.values(previewSrcRecordRef.current.srcRecord)}
          visible={imagePreviewVisiable}
          onVisibleChange={setImagePreviewVisiable}
          current={previewGroupCurrent}
          onChange={(index) => setPreviewGroupCurrent(index)}
        />
      </pageActionContext.Provider>
    </pageStateContext.Provider>
  );
};

export function usePageState() {
  const pageState = useContext(pageStateContext);
  const pageAction = useContext(pageActionContext);
  const pageStateRef = useRef(pageState);
  const pageActionRef = useRef(pageAction);
  pageStateRef.current = pageState;
  pageActionRef.current = pageAction;
  const re = useMemo(
    () => ({
      pageState: new Proxy({} as PageState, {
        get(obj, key: keyof PageState) {
          return pageStateRef.current[key];
        },
      }),
      pageAction: new Proxy({} as PageAction, {
        get(obj, key: keyof PageAction) {
          return pageActionRef.current[key];
        },
      }),
      PageStateProvider,
    }),
    []
  );
  return re;
  //   return { pageState, pageAction, PageStateProvider };
}
