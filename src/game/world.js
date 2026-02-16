import { ROOM_VARIANT_COUNT } from './constants.js';

export const WORLD = {
  bq_town: {
    id: 'bq_town',
    name: '比奇城',
    rooms: {
      gate: {
        id: 'gate',
        name: '城门',
        desc: '守卫盯着大道，行人络绎不绝。',
        exits: { north: 'bq_plains:plains', north1: 'bq_plains:plains1', north2: 'bq_plains:plains2', north3: 'bq_plains:plains3', east: 'market' },
        npcs: ['guard'],
        spawns: []
      },
      market: {
        id: 'market',
        name: '集市街',
        desc: '商人叫卖着药水与装备，练功木人静立一旁。',
        exits: { west: 'gate', east: 'blacksmith', south: 'temple' },
        npcs: ['shopkeeper'],
        spawns: []
      },
      blacksmith: {
        id: 'blacksmith',
        name: '铁匠铺',
        desc: '铁匠锤击通红的铁块，墙上挂满武器。',
        exits: { west: 'market' },
        npcs: ['blacksmith'],
        spawns: []
      },
      temple: {
        id: 'temple',
        name: '道观',
        desc: '清净幽深，道士在此讲授玄门之道。',
        exits: { north: 'market', east: 'magehall', south: 'port' },
        npcs: ['tao_master'],
        spawns: []
      },
      magehall: {
        id: 'magehall',
        name: '法师馆',
        desc: '法术卷轴散发微光，空气中弥漫着雷霆气息。',
        exits: { west: 'temple' },
        npcs: ['mage_master'],
        spawns: []
      },
      port: {
        id: 'port',
        name: '码头',
        desc: '远航的船只停靠在此，可前往苍月岛。',
        exits: { north: 'temple', south: 'cm_island:shore' },
        npcs: ['sailor'],
        spawns: []
      }
    }
  },
  bq_plains: {
    id: 'bq_plains',
    name: '比奇野外',
    rooms: {
      plains: {
        id: 'plains',
        name: '平原',
        desc: '开阔的草地上小怪徘徊，城镇在南边。',
        exits: { south: 'bq_town:gate', north: 'forest', east: 'wolfden', west: 'dssv:entrance' },
        spawns: ['chicken', 'chicken', 'deer', 'deer', 'sheep']
      },
      plains1: {
        id: 'plains1',
        name: '平原1',
        desc: '开阔的草地上小怪徘徊，城镇在南边。',
        exits: { south: 'bq_town:gate', north: 'forest1', east: 'wolfden1', west: 'dssv:entrance1' },
        spawns: ['chicken', 'chicken', 'deer', 'deer', 'sheep']
      },
      plains2: {
        id: 'plains2',
        name: '平原2',
        desc: '开阔的草地上小怪徘徊，城镇在南边。',
        exits: { south: 'bq_town:gate', north: 'forest2', east: 'wolfden2', west: 'dssv:entrance2' },
        spawns: ['chicken', 'chicken', 'deer', 'deer', 'sheep']
      },
      plains3: {
        id: 'plains3',
        name: '平原3',
        desc: '开阔的草地上小怪徘徊，城镇在南边。',
        exits: { south: 'bq_town:gate', north: 'forest3', east: 'wolfden3', west: 'dssv:entrance3' },
        spawns: ['chicken', 'chicken', 'deer', 'deer', 'sheep']
      },
      forest: {
        id: 'forest',
        name: '林地',
        desc: '高树投下阴影，狼群在这里潜伏。',
        exits: { south: 'plains', north: 'ruins' },
        spawns: ['wolf', 'wolf', 'bee', 'bee', 'cat']
      },
      forest1: {
        id: 'forest1',
        name: '林地1',
        desc: '高树投下阴影，狼群在这里潜伏。',
        exits: { south: 'plains1', north: 'ruins1' },
        spawns: ['wolf', 'wolf', 'bee', 'bee', 'cat']
      },
      forest2: {
        id: 'forest2',
        name: '林地2',
        desc: '高树投下阴影，狼群在这里潜伏。',
        exits: { south: 'plains2', north: 'ruins2' },
        spawns: ['wolf', 'wolf', 'bee', 'bee', 'cat']
      },
      forest3: {
        id: 'forest3',
        name: '林地3',
        desc: '高树投下阴影，狼群在这里潜伏。',
        exits: { south: 'plains3', north: 'ruins3' },
        spawns: ['wolf', 'wolf', 'bee', 'bee', 'cat']
      },
      wolfden: {
        id: 'wolfden',
        name: '狼穴',
        desc: '遍地白骨，寒冷的嚎叫回荡。',
        exits: { west: 'plains' },
        spawns: ['wolf', 'wolf', 'wolf', 'wolf', 'wolf']
      },
      wolfden1: {
        id: 'wolfden1',
        name: '狼穴1',
        desc: '遍地白骨，寒冷的嚎叫回荡。',
        exits: { west: 'plains1' },
        spawns: ['wolf', 'wolf', 'wolf', 'wolf', 'wolf']
      },
      wolfden2: {
        id: 'wolfden2',
        name: '狼穴2',
        desc: '遍地白骨，寒冷的嚎叫回荡。',
        exits: { west: 'plains2' },
        spawns: ['wolf', 'wolf', 'wolf', 'wolf', 'wolf']
      },
      wolfden3: {
        id: 'wolfden3',
        name: '狼穴3',
        desc: '遍地白骨，寒冷的嚎叫回荡。',
        exits: { west: 'plains3' },
        spawns: ['wolf', 'wolf', 'wolf', 'wolf', 'wolf']
      },
      ruins: {
        id: 'ruins',
        name: '古代遗迹',
        desc: '残破石块与诡异寂静，骷髅在此游荡。',
        exits: { south: 'forest', north: 'mine:entrance' },
        spawns: ['skeleton', 'skeleton', 'skeleton', 'skeleton', 'spider']
      },
      ruins1: {
        id: 'ruins1',
        name: '古代遗迹1',
        desc: '残破石块与诡异寂静，骷髅在此游荡。',
        exits: { south: 'forest1', north: 'mine:entrance1' },
        spawns: ['skeleton', 'skeleton', 'skeleton', 'skeleton', 'spider']
      },
      ruins2: {
        id: 'ruins2',
        name: '古代遗迹2',
        desc: '残破石块与诡异寂静，骷髅在此游荡。',
        exits: { south: 'forest2', north: 'mine:entrance2' },
        spawns: ['skeleton', 'skeleton', 'skeleton', 'skeleton', 'spider']
      },
      ruins3: {
        id: 'ruins3',
        name: '古代遗迹3',
        desc: '残破石块与诡异寂静，骷髅在此游荡。',
        exits: { south: 'forest3', north: 'mine:entrance3' },
        spawns: ['skeleton', 'skeleton', 'skeleton', 'skeleton', 'spider']
      }
    }
  },
  dssv: {
    id: 'dssv',
    name: '毒蛇山谷',
    rooms: {
      entrance: {
        id: 'entrance',
        name: '山谷入口',
        desc: '毒雾弥漫，蛇影窜动。',
        exits: { east: 'bq_plains:plains', north: 'deep' },
        spawns: ['red_snake', 'red_snake', 'red_snake', 'tiger_snake', 'tiger_snake']
      },
      entrance1: {
        id: 'entrance1',
        name: '山谷入口1',
        desc: '毒雾弥漫，蛇影窜动。',
        exits: { east: 'bq_plains:plains1', north: 'deep1' },
        spawns: ['red_snake', 'red_snake', 'red_snake', 'tiger_snake', 'tiger_snake']
      },
      entrance2: {
        id: 'entrance2',
        name: '山谷入口2',
        desc: '毒雾弥漫，蛇影窜动。',
        exits: { east: 'bq_plains:plains2', north: 'deep2' },
        spawns: ['red_snake', 'red_snake', 'red_snake', 'tiger_snake', 'tiger_snake']
      },
      entrance3: {
        id: 'entrance3',
        name: '山谷入口3',
        desc: '毒雾弥漫，蛇影窜动。',
        exits: { east: 'bq_plains:plains3', north: 'deep3' },
        spawns: ['red_snake', 'red_snake', 'red_snake', 'tiger_snake', 'tiger_snake']
      },
      deep: {
        id: 'deep',
        name: '山谷深处',
        desc: '阴冷潮湿，邪恶毒蛇盘踞。',
        exits: { south: 'entrance', north: 'mine:entrance' },
        spawns: ['red_snake', 'tiger_snake', 'evil_snake', 'evil_snake', 'evil_snake']
      },
      deep1: {
        id: 'deep1',
        name: '山谷深处1',
        desc: '阴冷潮湿，邪恶毒蛇盘踞。',
        exits: { south: 'entrance1', north: 'mine:entrance1' },
        spawns: ['red_snake', 'tiger_snake', 'evil_snake', 'evil_snake', 'evil_snake']
      },
      deep2: {
        id: 'deep2',
        name: '山谷深处2',
        desc: '阴冷潮湿，邪恶毒蛇盘踞。',
        exits: { south: 'entrance2', north: 'mine:entrance2' },
        spawns: ['red_snake', 'tiger_snake', 'evil_snake', 'evil_snake', 'evil_snake']
      },
      deep3: {
        id: 'deep3',
        name: '山谷深处3',
        desc: '阴冷潮湿，邪恶毒蛇盘踞。',
        exits: { south: 'entrance3', north: 'mine:entrance3' },
        spawns: ['red_snake', 'tiger_snake', 'evil_snake', 'evil_snake', 'evil_snake']
      }
    }
  },
  mine: {
    id: 'mine',
    name: '比奇矿区',
    rooms: {
      entrance: {
        id: 'entrance',
        name: '矿区入口',
        desc: '矿洞阴暗，僵尸游荡。',
        exits: { south: 'bq_plains:ruins', north: 'depths' },
        spawns: ['zombie', 'zombie', 'elec_zombie', 'elec_zombie', 'craw_zombie']
      },
      entrance1: {
        id: 'entrance1',
        name: '矿区入口1',
        desc: '矿洞阴暗，僵尸游荡。',
        exits: { south: 'bq_plains:ruins1', north: 'depths1' },
        spawns: ['zombie', 'zombie', 'elec_zombie', 'elec_zombie', 'craw_zombie']
      },
      entrance2: {
        id: 'entrance2',
        name: '矿区入口2',
        desc: '矿洞阴暗，僵尸游荡。',
        exits: { south: 'bq_plains:ruins2', north: 'depths2' },
        spawns: ['zombie', 'zombie', 'elec_zombie', 'elec_zombie', 'craw_zombie']
      },
      entrance3: {
        id: 'entrance3',
        name: '矿区入口3',
        desc: '矿洞阴暗，僵尸游荡。',
        exits: { south: 'bq_plains:ruins3', north: 'depths3' },
        spawns: ['zombie', 'zombie', 'elec_zombie', 'elec_zombie', 'craw_zombie']
      },
      depths: {
        id: 'depths',
        name: '矿区深处',
        desc: '腐臭弥漫，怪物更加凶残。',
        exits: { south: 'entrance', north: 'wgc:entrance' },
        spawns: ['zombie', 'black_worm', 'moth', 'moth', 'cave_bat']
      },
      depths1: {
        id: 'depths1',
        name: '矿区深处1',
        desc: '腐臭弥漫，怪物更加凶残。',
        exits: { south: 'entrance1', north: 'wgc:entrance1' },
        spawns: ['zombie', 'black_worm', 'moth', 'moth', 'cave_bat']
      },
      depths2: {
        id: 'depths2',
        name: '矿区深处2',
        desc: '腐臭弥漫，怪物更加凶残。',
        exits: { south: 'entrance2', north: 'wgc:entrance2' },
        spawns: ['zombie', 'black_worm', 'moth', 'moth', 'cave_bat']
      },
      depths3: {
        id: 'depths3',
        name: '矿区深处3',
        desc: '腐臭弥漫，怪物更加凶残。',
        exits: { south: 'entrance3', north: 'wgc:entrance3' },
        spawns: ['zombie', 'black_worm', 'moth', 'moth', 'cave_bat']
      }
    }
  },
  wgc: {
    id: 'wgc',
    name: '蜈蚣洞',
    rooms: {
      entrance: {
        id: 'entrance',
        name: '蜈蚣洞入口',
        desc: '潮湿闷热，虫声四起。',
        exits: { south: 'mine:depths', north: 'deep' },
        spawns: ['centipede', 'centipede', 'scorpion', 'scorpion', 'black_worm']
      },
      entrance1: {
        id: 'entrance1',
        name: '蜈蚣洞入口1',
        desc: '潮湿闷热，虫声四起。',
        exits: { south: 'mine:depths1', north: 'deep1' },
        spawns: ['centipede', 'centipede', 'scorpion', 'scorpion', 'black_worm']
      },
      entrance2: {
        id: 'entrance2',
        name: '蜈蚣洞入口2',
        desc: '潮湿闷热，虫声四起。',
        exits: { south: 'mine:depths2', north: 'deep2' },
        spawns: ['centipede', 'centipede', 'scorpion', 'scorpion', 'black_worm']
      },
      entrance3: {
        id: 'entrance3',
        name: '蜈蚣洞入口3',
        desc: '潮湿闷热，虫声四起。',
        exits: { south: 'mine:depths3', north: 'deep3' },
        spawns: ['centipede', 'centipede', 'scorpion', 'scorpion', 'black_worm']
      },
      deep: {
        id: 'deep',
        name: '蜈蚣洞深处',
        desc: '触龙神盘踞其中。',
        exits: { south: 'entrance', north: 'mg_plains:gate' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'ghoul', 'bug_queen']
      },
      deep1: {
        id: 'deep1',
        name: '蜈蚣洞深处1',
        desc: '触龙神盘踞其中。',
        exits: { south: 'entrance1', north: 'mg_plains:gate1' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'ghoul', 'bug_queen']
      },
      deep2: {
        id: 'deep2',
        name: '蜈蚣洞深处2',
        desc: '触龙神盘踞其中。',
        exits: { south: 'entrance2', north: 'mg_plains:gate2' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'ghoul', 'bug_queen']
      },
      deep3: {
        id: 'deep3',
        name: '蜈蚣洞深处3',
        desc: '触龙神盘踞其中。',
        exits: { south: 'entrance3', north: 'mg_plains:gate3' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'ghoul', 'bug_queen']
      }
    }
  },
  mg_plains: {
    id: 'mg_plains',
    name: '盟重省',
    rooms: {
      gate: {
        id: 'gate',
        name: '盟重入口',
        desc: '黄沙漫天，通往各大地图。',
        exits: { south: 'wgc:deep', north: 'mg_town:gate', west: 'sm:entrance', east: 'fm:gate', northwest: 'brm:gate', northeast: 'sb_town:gate', cultivation: 'cultivation:entry', tower: 'zxft:entry', vip: 'pboss:entry' },
        spawns: ['half_orc', 'half_orc', 'half_orc', 'half_orc_warrior', 'half_orc_warrior']
      },
      gate1: {
        id: 'gate1',
        name: '盟重入口1',
        desc: '黄沙漫天，通往各大地图。',
        exits: { south: 'wgc:deep1', north: 'mg_town:gate', west: 'sm:entrance1', east: 'fm:gate1', northwest: 'brm:gate1', northeast: 'sb_town:gate', cultivation: 'cultivation:entry', tower: 'zxft:entry' },
        spawns: ['half_orc', 'half_orc', 'half_orc', 'half_orc_warrior', 'half_orc_warrior']
      },
      gate2: {
        id: 'gate2',
        name: '盟重入口2',
        desc: '黄沙漫天，通往各大地图。',
        exits: { south: 'wgc:deep2', north: 'mg_town:gate', west: 'sm:entrance2', east: 'fm:gate2', northwest: 'brm:gate2', northeast: 'sb_town:gate', cultivation: 'cultivation:entry', tower: 'zxft:entry' },
        spawns: ['half_orc', 'half_orc', 'half_orc', 'half_orc_warrior', 'half_orc_warrior']
      },
      gate3: {
        id: 'gate3',
        name: '盟重入口3',
        desc: '黄沙漫天，通往各大地图。',
        exits: { south: 'wgc:deep3', north: 'mg_town:gate', west: 'sm:entrance3', east: 'fm:gate3', northwest: 'brm:gate3', northeast: 'sb_town:gate', cultivation: 'cultivation:entry', tower: 'zxft:entry' },
        spawns: ['half_orc', 'half_orc', 'half_orc', 'half_orc_warrior', 'half_orc_warrior']
      }
    }
  },
  sb_town: {
    id: 'sb_town',
    name: '沙巴克',
    rooms: {
      gate: {
        id: 'gate',
        name: '沙城大门',
        desc: '城墙高耸，旗帜飘扬。',
        exits: { southwest: 'mg_plains:gate', north: 'street' },
        spawns: []
      },
      street: {
        id: 'street',
        name: '沙城街道',
        desc: '行会的脚步声在石板上回响。',
        exits: { south: 'gate', north: 'palace' },
        spawns: []
      },
      palace: {
        id: 'palace',
        name: '沙城皇宫',
        desc: '王座之上空无一人。',
        exits: { south: 'street', north: 'sb_guild:sanctum' },
        spawns: []
      }
    }
  },
  sb_guild: {
    id: 'sb_guild',
    name: '沙巴克秘境',
    rooms: {
      sanctum: {
        id: 'sanctum',
        name: '守护神殿',
        desc: '只对城主行会开放的秘境，守护者在此沉睡。',
        exits: { south: 'sb_town:palace' },
        spawns: ['sabak_boss'],
        sabakOnly: true
      }
    }
  },
  sm: {
    id: 'sm',
    name: '石墓阵',
    rooms: {
      entrance: {
        id: 'entrance',
        name: '石墓入口',
        desc: '低沉的嚎叫回响。',
        exits: { east: 'mg_plains:gate', north: 'deep' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'moth']
      },
      entrance1: {
        id: 'entrance1',
        name: '石墓入口1',
        desc: '低沉的嚎叫回响。',
        exits: { east: 'mg_plains:gate1', north: 'deep1' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'moth']
      },
      entrance2: {
        id: 'entrance2',
        name: '石墓入口2',
        desc: '低沉的嚎叫回响。',
        exits: { east: 'mg_plains:gate2', north: 'deep2' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'moth']
      },
      entrance3: {
        id: 'entrance3',
        name: '石墓入口3',
        desc: '低沉的嚎叫回响。',
        exits: { east: 'mg_plains:gate3', north: 'deep3' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'moth']
      },
      deep: {
        id: 'deep',
        name: '石墓深处',
        desc: '白野猪出没。',
        exits: { south: 'entrance' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'pig_white']
      },
      deep1: {
        id: 'deep1',
        name: '石墓深处1',
        desc: '白野猪出没。',
        exits: { south: 'entrance1' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'pig_white']
      },
      deep2: {
        id: 'deep2',
        name: '石墓深处2',
        desc: '白野猪出没。',
        exits: { south: 'entrance2' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'pig_white']
      },
      deep3: {
        id: 'deep3',
        name: '石墓深处3',
        desc: '白野猪出没。',
        exits: { south: 'entrance3' },
        spawns: ['pig_red', 'pig_red', 'pig_black', 'pig_black', 'pig_white']
      }
    }
  },
  mg_town: {
    id: 'mg_town',
    name: '盟重土城',
    rooms: {
      gate: {
        id: 'gate',
        name: '土城城门',
        desc: '黄沙漫天，旅人聚集。',
        exits: { south: 'mg_plains:gate', south1: 'mg_plains:gate1', south2: 'mg_plains:gate2', south3: 'mg_plains:gate3', north: 'mg_market', west: 'wms:entrance', west1: 'wms:entrance1', west2: 'wms:entrance2', west3: 'wms:entrance3', east: 'zm:hall', east1: 'zm:hall1', east2: 'zm:hall2', east3: 'zm:hall3', northeast: 'cr:valley', northeast1: 'cr:valley1', northeast2: 'cr:valley2', northeast3: 'cr:valley3', northwest: 'wb:lair', up: 'crb:arena', down: 'crr:arena', southwest: 'dark_bosses:dark_woma_lair', southwest1: 'dark_bosses:dark_zuma_lair', southwest2: 'dark_bosses:dark_hongmo_lair', southwest3: 'dark_bosses:dark_huangquan_lair', southwest4: 'dark_bosses:dark_doublehead_lair', southwest5: 'dark_bosses:dark_skeleton_lair' },
        npcs: ['guard'],
        spawns: []
      },
      mg_market: {
        id: 'mg_market',
        name: '土城集市',
        desc: '补给齐全，消息也最灵通。',
        exits: { south: 'gate', east: 'mg_blacksmith', west: 'mg_magic' },
        npcs: ['shopkeeper'],
        spawns: []
      },
      mg_blacksmith: {
        id: 'mg_blacksmith',
        name: '土城铁匠',
        desc: '叮当作响，兵器锋利。',
        exits: { west: 'mg_market' },
        npcs: ['blacksmith'],
        spawns: []
      },
      mg_magic: {
        id: 'mg_magic',
        name: '法师工会',
        desc: '奥术的火花在这里闪烁。',
        exits: { east: 'mg_market', north: 'mg_tao' },
        npcs: ['mage_master'],
        spawns: []
      },
      mg_tao: {
        id: 'mg_tao',
        name: '道士工会',
        desc: '香火缭绕，道术悠长。',
        exits: { south: 'mg_magic' },
        npcs: ['tao_master'],
        spawns: []
      }
    }
  },
  wms: {
    id: 'wms',
    name: '沃玛寺庙',
    rooms: {
      entrance: {
        id: 'entrance',
        name: '寺庙入口',
        desc: '阴风阵阵，沃玛的影子在石壁上闪动。',
        exits: { east: 'mg_town:gate', north: 'hall' },
        spawns: ['woma_guard', 'woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior']
      },
      entrance1: {
        id: 'entrance1',
        name: '寺庙入口1',
        desc: '阴风阵阵，沃玛的影子在石壁上闪动。',
        exits: { east: 'mg_town:gate', north: 'hall1' },
        spawns: ['woma_guard', 'woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior']
      },
      entrance2: {
        id: 'entrance2',
        name: '寺庙入口2',
        desc: '阴风阵阵，沃玛的影子在石壁上闪动。',
        exits: { east: 'mg_town:gate', north: 'hall2' },
        spawns: ['woma_guard', 'woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior']
      },
      entrance3: {
        id: 'entrance3',
        name: '寺庙入口3',
        desc: '阴风阵阵，沃玛的影子在石壁上闪动。',
        exits: { east: 'mg_town:gate', north: 'hall3' },
        spawns: ['woma_guard', 'woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior']
      },
      hall: {
        id: 'hall',
        name: '寺庙大厅',
        desc: '沃玛战士在此巡逻。',
        exits: { south: 'entrance', north: 'deep' },
        spawns: ['woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior', 'woma_mage']
      },
      hall1: {
        id: 'hall1',
        name: '寺庙大厅1',
        desc: '沃玛战士在此巡逻。',
        exits: { south: 'entrance1', north: 'deep' },
        spawns: ['woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior', 'woma_mage']
      },
      hall2: {
        id: 'hall2',
        name: '寺庙大厅2',
        desc: '沃玛战士在此巡逻。',
        exits: { south: 'entrance2', north: 'deep' },
        spawns: ['woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior', 'woma_mage']
      },
      hall3: {
        id: 'hall3',
        name: '寺庙大厅3',
        desc: '沃玛战士在此巡逻。',
        exits: { south: 'entrance3', north: 'deep' },
        spawns: ['woma_guard', 'woma_guard', 'woma_warrior', 'woma_warrior', 'woma_mage']
      },
      deep: {
        id: 'deep',
        name: '教主大厅',
        desc: '王座空旷，教主气息沉重。',
        exits: { south: 'hall' },
        spawns: ['woma_leader']
      }
    }
  },
  zm: {
    id: 'zm',
    name: '祖玛寺庙',
    rooms: {
      hall: {
        id: 'hall',
        name: '祖玛大厅',
        desc: '石像林立，弓箭手暗处窥视。',
        exits: { west: 'mg_town:gate', north: 'deep' },
        spawns: ['zuma_archer', 'zuma_archer', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      hall1: {
        id: 'hall1',
        name: '祖玛大厅1',
        desc: '石像林立，弓箭手暗处窥视。',
        exits: { west: 'mg_town:gate', north: 'deep1' },
        spawns: ['zuma_archer', 'zuma_archer', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      hall2: {
        id: 'hall2',
        name: '祖玛大厅2',
        desc: '石像林立，弓箭手暗处窥视。',
        exits: { west: 'mg_town:gate', north: 'deep2' },
        spawns: ['zuma_archer', 'zuma_archer', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      hall3: {
        id: 'hall3',
        name: '祖玛大厅3',
        desc: '石像林立，弓箭手暗处窥视。',
        exits: { west: 'mg_town:gate', north: 'deep3' },
        spawns: ['zuma_archer', 'zuma_archer', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      deep: {
        id: 'deep',
        name: '祖玛深处',
        desc: '祖玛教主的气息在此涌动。',
        exits: { south: 'hall', north: 'throne' },
        spawns: ['zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      deep1: {
        id: 'deep1',
        name: '祖玛深处1',
        desc: '祖玛教主的气息在此涌动。',
        exits: { south: 'hall1', north: 'throne' },
        spawns: ['zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      deep2: {
        id: 'deep2',
        name: '祖玛深处2',
        desc: '祖玛教主的气息在此涌动。',
        exits: { south: 'hall2', north: 'throne' },
        spawns: ['zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      deep3: {
        id: 'deep3',
        name: '祖玛深处3',
        desc: '祖玛教主的气息在此涌动。',
        exits: { south: 'hall3', north: 'throne' },
        spawns: ['zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_guard', 'zuma_statue']
      },
      throne: {
        id: 'throne',
        name: '祖玛王座',
        desc: '宏伟王座，教主现身。',
        exits: { south: 'deep' },
        spawns: ['zuma_leader']
      }
    }
  },
  cr: {
    id: 'cr',
    name: '赤月峡谷',
    rooms: {
      valley: {
        id: 'valley',
        name: '赤月入口',
        desc: '空气凝重，蜘蛛遍地。',
        exits: { south: 'mg_town:gate', north: 'nest' },
        spawns: ['chiyue_spider', 'chiyue_spider', 'chiyue_spider', 'chiyue_flower', 'chiyue_flower']
      },
      valley1: {
        id: 'valley1',
        name: '赤月入口1',
        desc: '空气凝重，蜘蛛遍地。',
        exits: { south: 'mg_town:gate', north: 'nest1' },
        spawns: ['chiyue_spider', 'chiyue_spider', 'chiyue_spider', 'chiyue_flower', 'chiyue_flower']
      },
      valley2: {
        id: 'valley2',
        name: '赤月入口2',
        desc: '空气凝重，蜘蛛遍地。',
        exits: { south: 'mg_town:gate', north: 'nest2' },
        spawns: ['chiyue_spider', 'chiyue_spider', 'chiyue_spider', 'chiyue_flower', 'chiyue_flower']
      },
      valley3: {
        id: 'valley3',
        name: '赤月入口3',
        desc: '空气凝重，蜘蛛遍地。',
        exits: { south: 'mg_town:gate', north: 'nest3' },
        spawns: ['chiyue_spider', 'chiyue_spider', 'chiyue_spider', 'chiyue_flower', 'chiyue_flower']
      },
      nest: {
        id: 'nest',
        name: '赤月巢穴',
        desc: '血色粘液覆盖墙壁。',
        exits: { south: 'valley', north: 'demon' },
        spawns: ['chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_blood']
      },
      nest1: {
        id: 'nest1',
        name: '赤月巢穴1',
        desc: '血色粘液覆盖墙壁。',
        exits: { south: 'valley1', north: 'demon' },
        spawns: ['chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_blood']
      },
      nest2: {
        id: 'nest2',
        name: '赤月巢穴2',
        desc: '血色粘液覆盖墙壁。',
        exits: { south: 'valley2', north: 'demon' },
        spawns: ['chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_blood']
      },
      nest3: {
        id: 'nest3',
        name: '赤月巢穴3',
        desc: '血色粘液覆盖墙壁。',
        exits: { south: 'valley3', north: 'demon' },
        spawns: ['chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_guard', 'chiyue_blood']
      },
      demon: {
        id: 'demon',
        name: '恶魔祭坛',
        desc: '赤月恶魔沉睡于此。',
        exits: { south: 'nest' },
        spawns: ['chiyue_demon']
      }
    }
  },
  fm: {
    id: 'fm',
    name: '封魔谷',
    rooms: {
      gate: {
        id: 'gate',
        name: '封魔入口',
        desc: '浓雾笼罩，邪气逼人。',
        exits: { west: 'mg_plains:gate', north: 'deep' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'half_orc_elite', 'half_orc_elite']
      },
      gate1: {
        id: 'gate1',
        name: '封魔入口1',
        desc: '浓雾笼罩，邪气逼人。',
        exits: { west: 'mg_plains:gate1', north: 'deep' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'half_orc_elite', 'half_orc_elite']
      },
      gate2: {
        id: 'gate2',
        name: '封魔入口2',
        desc: '浓雾笼罩，邪气逼人。',
        exits: { west: 'mg_plains:gate2', north: 'deep' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'half_orc_elite', 'half_orc_elite']
      },
      gate3: {
        id: 'gate3',
        name: '封魔入口3',
        desc: '浓雾笼罩，邪气逼人。',
        exits: { west: 'mg_plains:gate3', north: 'deep' },
        spawns: ['ghoul', 'ghoul', 'ghoul', 'half_orc_elite', 'half_orc_elite']
      },
      deep: {
        id: 'deep',
        name: '封魔深处',
        desc: '虹魔教主的地盘。',
        exits: { south: 'gate' },
        spawns: ['fmg_pig', 'fmg_pig', 'fmg_scorpion', 'fmg_scorpion', 'fmg_demon']
      }
    }
  },
  brm: {
    id: 'brm',
    name: '白日门',
    rooms: {
      gate: {
        id: 'gate',
        name: '白日门入口',
        desc: '丛林的气息扑面而来。',
        exits: { west: 'mg_plains:gate', north: 'jungle' },
        spawns: ['half_orc_elite', 'half_orc_elite', 'half_orc_elite', 'spider', 'spider']
      },
      gate1: {
        id: 'gate1',
        name: '白日门入口1',
        desc: '丛林的气息扑面而来。',
        exits: { west: 'mg_plains:gate1', north: 'jungle' },
        spawns: ['half_orc_elite', 'half_orc_elite', 'half_orc_elite', 'spider', 'spider']
      },
      gate2: {
        id: 'gate2',
        name: '白日门入口2',
        desc: '丛林的气息扑面而来。',
        exits: { west: 'mg_plains:gate2', north: 'jungle' },
        spawns: ['half_orc_elite', 'half_orc_elite', 'half_orc_elite', 'spider', 'spider']
      },
      gate3: {
        id: 'gate3',
        name: '白日门入口3',
        desc: '丛林的气息扑面而来。',
        exits: { west: 'mg_plains:gate3', north: 'jungle' },
        spawns: ['half_orc_elite', 'half_orc_elite', 'half_orc_elite', 'spider', 'spider']
      },
      jungle: {
        id: 'jungle',
        name: '丛林深处',
        desc: '千年树妖潜伏其中。',
        exits: { south: 'gate' },
        spawns: ['tree_demon', 'tree_demon', 'tree_demon', 'tree_demon', 'tree_demon']
      }
    }
  },
  cm_island: {
    id: 'cm_island',
    name: '苍月岛',
    rooms: {
      shore: {
        id: 'shore',
        name: '海滩',
        desc: '海风袭来，渔火点点。',
        exits: { north: 'village', south: 'bq_town:port' },
        spawns: ['bee', 'bee', 'bee', 'bee', 'bee']
      },
      shore1: {
        id: 'shore1',
        name: '海滩1',
        desc: '海风袭来，渔火点点。',
        exits: { north: 'village', south: 'bq_town:port' },
        spawns: ['bee', 'bee', 'bee', 'bee', 'bee']
      },
      shore2: {
        id: 'shore2',
        name: '海滩2',
        desc: '海风袭来，渔火点点。',
        exits: { north: 'village', south: 'bq_town:port' },
        spawns: ['bee', 'bee', 'bee', 'bee', 'bee']
      },
      shore3: {
        id: 'shore3',
        name: '海滩3',
        desc: '海风袭来，渔火点点。',
        exits: { north: 'village', south: 'bq_town:port' },
        spawns: ['bee', 'bee', 'bee', 'bee', 'bee']
      },
      village: {
        id: 'village',
        name: '苍月村',
        desc: '岛民生活在此，宁静祥和。',
        exits: { south: 'shore', south1: 'shore1', south2: 'shore2', south3: 'shore3', north: 'bone:entrance', north1: 'bone:entrance1', north2: 'bone:entrance2', north3: 'bone:entrance3', east: 'nm_temple:entrance', east1: 'nm_temple:entrance1', east2: 'nm_temple:entrance2', east3: 'nm_temple:entrance3' },
        npcs: ['shopkeeper'],
        spawns: []
      }
    }
  },
  bone: {
    id: 'bone',
    name: '骨魔洞',
    rooms: {
      entrance: {
        id: 'entrance',
        name: '骨魔入口',
        desc: '骷髅的低语回响。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['bone_soldier', 'bone_soldier', 'bone_soldier', 'bone_general', 'bone_general']
      },
      entrance1: {
        id: 'entrance1',
        name: '骨魔入口1',
        desc: '骷髅的低语回响。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['bone_soldier', 'bone_soldier', 'bone_soldier', 'bone_general', 'bone_general']
      },
      entrance2: {
        id: 'entrance2',
        name: '骨魔入口2',
        desc: '骷髅的低语回响。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['bone_soldier', 'bone_soldier', 'bone_soldier', 'bone_general', 'bone_general']
      },
      entrance3: {
        id: 'entrance3',
        name: '骨魔入口3',
        desc: '骷髅的低语回响。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['bone_soldier', 'bone_soldier', 'bone_soldier', 'bone_general', 'bone_general']
      },
      deep: {
        id: 'deep',
        name: '骨魔深处',
        desc: '黄泉教主现身。',
        exits: { south: 'entrance' },
        spawns: ['huangquan']
      }
    }
  },
  nm_temple: {
    id: 'nm_temple',
    name: '牛魔寺庙',
    rooms: {
      entrance: {
        id: 'entrance',
        name: '牛魔入口',
        desc: '牛魔将军巡逻。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['nmmob', 'nmmob', 'nmmob', 'nm_mage', 'nm_mage']
      },
      entrance1: {
        id: 'entrance1',
        name: '牛魔入口1',
        desc: '牛魔将军巡逻。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['nmmob', 'nmmob', 'nmmob', 'nm_mage', 'nm_mage']
      },
      entrance2: {
        id: 'entrance2',
        name: '牛魔入口2',
        desc: '牛魔将军巡逻。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['nmmob', 'nmmob', 'nmmob', 'nm_mage', 'nm_mage']
      },
      entrance3: {
        id: 'entrance3',
        name: '牛魔入口3',
        desc: '牛魔将军巡逻。',
        exits: { south: 'cm_island:village', north: 'deep' },
        spawns: ['nmmob', 'nmmob', 'nmmob', 'nm_mage', 'nm_mage']
      },
      deep: {
        id: 'deep',
        name: '牛魔深处',
        desc: '牛魔王的王座。',
        exits: { south: 'entrance', north: 'molong:gate' },
        spawns: ['nm_boss']
      }
    }
  },
  molong: {
    id: 'molong',
    name: '魔龙城',
    rooms: {
      gate: {
        id: 'gate',
        name: '魔龙城门',
        desc: '钢铁与龙焰的味道。',
        exits: { west: 'nm_temple:deep', north: 'deep' },
        spawns: ['molong_guard', 'molong_guard', 'molong_guard', 'molong_guard', 'molong_guard']
      },
      gate1: {
        id: 'gate1',
        name: '魔龙城门1',
        desc: '钢铁与龙焰的味道。',
        exits: { west: 'nm_temple:deep', north: 'deep' },
        spawns: ['molong_guard', 'molong_guard', 'molong_guard', 'molong_guard', 'molong_guard']
      },
      gate2: {
        id: 'gate2',
        name: '魔龙城门2',
        desc: '钢铁与龙焰的味道。',
        exits: { west: 'nm_temple:deep', north: 'deep' },
        spawns: ['molong_guard', 'molong_guard', 'molong_guard', 'molong_guard', 'molong_guard']
      },
      gate3: {
        id: 'gate3',
        name: '魔龙城门3',
        desc: '钢铁与龙焰的味道。',
        exits: { west: 'nm_temple:deep', north: 'deep' },
        spawns: ['molong_guard', 'molong_guard', 'molong_guard', 'molong_guard', 'molong_guard']
      },
      deep: {
        id: 'deep',
        name: '魔龙深处',
        desc: '魔龙教主在此守望。',
        exits: { south: 'gate' },
        spawns: ['molong_boss']
      }
    }
  }
  ,
  pboss: {
    id: 'pboss',
    name: '专属BOSS领域',
    rooms: {
      entry: {
        id: 'entry',
        name: '专属入口',
        desc: '仅供VIP/SVIP挑战的个人专属BOSS领域。',
        exits: {
          south: 'mg_plains:gate',
          north: 'vip_lair',
          east: 'svip_lair',
          up: 'perma_lair'
        },
        spawns: []
      }
    }
  }
  ,
  zxft: {
    id: 'zxft',
    name: '诛仙浮图塔',
    rooms: {
      entry: {
        id: 'entry',
        name: '入口',
        desc: '古老浮屠直入云霄，塔内每层都更危险。',
        exits: { south: 'mg_plains:gate', north: 'floor_01_x' },
        spawns: []
      }
    }
  }
  ,
  wb: {
    id: 'wb',
    name: '世界BOSS领域',
    rooms: {
      lair: {
        id: 'lair',
        name: '炎龙巢穴',
        desc: '灼热气息翻涌，世界BOSS盘踞于此。',
        exits: { southeast: 'mg_town:gate' },
        spawns: ['world_boss']
      }
    }
  }
  ,

  crb: {
    id: 'crb',
    name: '跨服BOSS领域',
    rooms: {
      arena: {
        id: 'arena',
        name: '跨服BOSS战场',
        desc: '各区服玩家同场战斗，世界BOSS盘踞于此。',
        exits: { southeast: 'mg_town:gate' },
        spawns: ['cross_world_boss']
      }
    }
  }
  ,

  crr: {
    id: 'crr',
    name: '跨服排位赛场',
    rooms: {
      arena: {
        id: 'arena',
        name: '跨服排位赛',
        desc: '跨服排位赛活动房间，所有区服玩家同场竞技。',
        exits: { southeast: 'mg_town:gate' },
        spawns: []
      }
    }
  }
  ,

  dark_bosses: {
    id: 'dark_bosses',
    name: '暗之BOSS领域',
    rooms: {
      dark_woma_lair: {
        id: 'dark_woma_lair',
        name: '暗之沃玛神殿',
        desc: '暗之沃玛教主在此守望。',
        exits: { northeast: 'mg_town:gate' },
        spawns: ['dark_woma_boss']
      }
      ,
      dark_zuma_lair: {
        id: 'dark_zuma_lair',
        name: '暗之祖玛神殿',
        desc: '暗之祖玛教主在此守望。',
        exits: { northeast: 'mg_town:gate' },
        spawns: ['dark_zuma_boss']
      }
      ,
      dark_hongmo_lair: {
        id: 'dark_hongmo_lair',
        name: '暗之虹魔神殿',
        desc: '暗之虹魔教主在此守望。',
        exits: { northeast: 'mg_town:gate' },
        spawns: ['dark_hongmo_boss']
      }
      ,
      dark_huangquan_lair: {
        id: 'dark_huangquan_lair',
        name: '暗之黄泉神殿',
        desc: '暗之黄泉教主在此守望。',
        exits: { northeast: 'mg_town:gate' },
        spawns: ['dark_huangquan_boss']
      }
      ,
      dark_doublehead_lair: {
        id: 'dark_doublehead_lair',
        name: '暗之血魔神殿',
        desc: '暗之双头血魔在此守望。',
        exits: { northeast: 'mg_town:gate' },
        spawns: ['dark_doublehead_boss']
      }
      ,
      dark_skeleton_lair: {
        id: 'dark_skeleton_lair',
        name: '暗之骷髅神殿',
        desc: '暗之骷髅精灵在此守望。',
        exits: { northeast: 'mg_town:gate' },
        spawns: ['dark_skeleton_boss']
      }
    }
  },

  cultivation: {
    id: 'cultivation',
    name: '修真秘境',
    rooms: {
      entry: {
        id: 'entry',
        name: '修真入口',
        desc: '通往各阶修真地图的入口。',
        exits: {
          south: 'mg_plains:gate',
          field_zhuji: 'field_zhuji',
          boss_zhuji: 'boss_zhuji',
          field_lingxu: 'field_lingxu',
          boss_lingxu: 'boss_lingxu',
          field_hehe: 'field_hehe',
          boss_hehe: 'boss_hehe',
          field_yuanying: 'field_yuanying',
          boss_yuanying: 'boss_yuanying',
          field_kongming: 'field_kongming',
          boss_kongming: 'boss_kongming',
          field_lvshuang: 'field_lvshuang',
          boss_lvshuang: 'boss_lvshuang',
          field_dujie: 'field_dujie',
          boss_dujie: 'boss_dujie',
          field_jimie: 'field_jimie',
          boss_jimie: 'boss_jimie',
          field_dacheng: 'field_dacheng',
          boss_dacheng: 'boss_dacheng',
          field_shangxian: 'field_shangxian',
          boss_shangxian: 'boss_shangxian',
          field_zhenxian: 'field_zhenxian',
          boss_zhenxian: 'boss_zhenxian',
          field_tianxian: 'field_tianxian',
          boss_tianxian: 'boss_tianxian'
        },
        spawns: []
      },
      field_zhuji: {
        id: 'field_zhuji',
        name: '筑基修真境',
        desc: '筑基修士历练之地。',
        exits: { south: 'entry', north: 'boss_zhuji' },
        spawns: ['cultivation_zhuji_1', 'cultivation_zhuji_2', 'cultivation_zhuji_3', 'cultivation_zhuji_4', 'cultivation_zhuji_5'],
        minCultivationLevel: 0
      },
      field_zhuji1: {
        id: 'field_zhuji1',
        name: '筑基修真境1',
        desc: '筑基修士历练之地。',
        exits: { south: 'entry', north: 'boss_zhuji' },
        spawns: ['cultivation_zhuji_1', 'cultivation_zhuji_2', 'cultivation_zhuji_3', 'cultivation_zhuji_4', 'cultivation_zhuji_5'],
        minCultivationLevel: 0
      },
      field_zhuji2: {
        id: 'field_zhuji2',
        name: '筑基修真境2',
        desc: '筑基修士历练之地。',
        exits: { south: 'entry', north: 'boss_zhuji' },
        spawns: ['cultivation_zhuji_1', 'cultivation_zhuji_2', 'cultivation_zhuji_3', 'cultivation_zhuji_4', 'cultivation_zhuji_5'],
        minCultivationLevel: 0
      },
      field_zhuji3: {
        id: 'field_zhuji3',
        name: '筑基修真境3',
        desc: '筑基修士历练之地。',
        exits: { south: 'entry', north: 'boss_zhuji' },
        spawns: ['cultivation_zhuji_1', 'cultivation_zhuji_2', 'cultivation_zhuji_3', 'cultivation_zhuji_4', 'cultivation_zhuji_5'],
        minCultivationLevel: 0
      },
      boss_zhuji: {
        id: 'boss_zhuji',
        name: '筑基魔宫',
        desc: '筑基魔君盘踞于此。',
        exits: { south: 'field_zhuji' },
        spawns: ['cultivation_boss_zhuji'],
        minCultivationLevel: 0
      },
      field_lingxu: {
        id: 'field_lingxu',
        name: '灵虚修真境',
        desc: '灵虚之境，灵气翻涌。',
        exits: { south: 'entry', north: 'boss_lingxu' },
        spawns: ['cultivation_lingxu_1', 'cultivation_lingxu_2', 'cultivation_lingxu_3', 'cultivation_lingxu_4', 'cultivation_lingxu_5'],
        minCultivationLevel: 1
      },
      field_lingxu1: {
        id: 'field_lingxu1',
        name: '灵虚修真境1',
        desc: '灵虚之境，灵气翻涌。',
        exits: { south: 'entry', north: 'boss_lingxu' },
        spawns: ['cultivation_lingxu_1', 'cultivation_lingxu_2', 'cultivation_lingxu_3', 'cultivation_lingxu_4', 'cultivation_lingxu_5'],
        minCultivationLevel: 1
      },
      field_lingxu2: {
        id: 'field_lingxu2',
        name: '灵虚修真境2',
        desc: '灵虚之境，灵气翻涌。',
        exits: { south: 'entry', north: 'boss_lingxu' },
        spawns: ['cultivation_lingxu_1', 'cultivation_lingxu_2', 'cultivation_lingxu_3', 'cultivation_lingxu_4', 'cultivation_lingxu_5'],
        minCultivationLevel: 1
      },
      field_lingxu3: {
        id: 'field_lingxu3',
        name: '灵虚修真境3',
        desc: '灵虚之境，灵气翻涌。',
        exits: { south: 'entry', north: 'boss_lingxu' },
        spawns: ['cultivation_lingxu_1', 'cultivation_lingxu_2', 'cultivation_lingxu_3', 'cultivation_lingxu_4', 'cultivation_lingxu_5'],
        minCultivationLevel: 1
      },
      boss_lingxu: {
        id: 'boss_lingxu',
        name: '灵虚魔宫',
        desc: '灵虚魔君镇守此地。',
        exits: { south: 'field_lingxu' },
        spawns: ['cultivation_boss_lingxu'],
        minCultivationLevel: 1
      },
      field_hehe: {
        id: 'field_hehe',
        name: '和合修真境',
        desc: '和合之境，阴阳相生。',
        exits: { south: 'entry', north: 'boss_hehe' },
        spawns: ['cultivation_hehe_1', 'cultivation_hehe_2', 'cultivation_hehe_3', 'cultivation_hehe_4', 'cultivation_hehe_5'],
        minCultivationLevel: 2
      },
      field_hehe1: {
        id: 'field_hehe1',
        name: '和合修真境1',
        desc: '和合之境，阴阳相生。',
        exits: { south: 'entry', north: 'boss_hehe' },
        spawns: ['cultivation_hehe_1', 'cultivation_hehe_2', 'cultivation_hehe_3', 'cultivation_hehe_4', 'cultivation_hehe_5'],
        minCultivationLevel: 2
      },
      field_hehe2: {
        id: 'field_hehe2',
        name: '和合修真境2',
        desc: '和合之境，阴阳相生。',
        exits: { south: 'entry', north: 'boss_hehe' },
        spawns: ['cultivation_hehe_1', 'cultivation_hehe_2', 'cultivation_hehe_3', 'cultivation_hehe_4', 'cultivation_hehe_5'],
        minCultivationLevel: 2
      },
      field_hehe3: {
        id: 'field_hehe3',
        name: '和合修真境3',
        desc: '和合之境，阴阳相生。',
        exits: { south: 'entry', north: 'boss_hehe' },
        spawns: ['cultivation_hehe_1', 'cultivation_hehe_2', 'cultivation_hehe_3', 'cultivation_hehe_4', 'cultivation_hehe_5'],
        minCultivationLevel: 2
      },
      boss_hehe: {
        id: 'boss_hehe',
        name: '和合魔宫',
        desc: '和合魔君坐镇。',
        exits: { south: 'field_hehe' },
        spawns: ['cultivation_boss_hehe'],
        minCultivationLevel: 2
      },
      field_yuanying: {
        id: 'field_yuanying',
        name: '元婴修真境',
        desc: '元婴之境，气势恢宏。',
        exits: { south: 'entry', north: 'boss_yuanying' },
        spawns: ['cultivation_yuanying_1', 'cultivation_yuanying_2', 'cultivation_yuanying_3', 'cultivation_yuanying_4', 'cultivation_yuanying_5'],
        minCultivationLevel: 3
      },
      field_yuanying1: {
        id: 'field_yuanying1',
        name: '元婴修真境1',
        desc: '元婴之境，气势恢宏。',
        exits: { south: 'entry', north: 'boss_yuanying' },
        spawns: ['cultivation_yuanying_1', 'cultivation_yuanying_2', 'cultivation_yuanying_3', 'cultivation_yuanying_4', 'cultivation_yuanying_5'],
        minCultivationLevel: 3
      },
      field_yuanying2: {
        id: 'field_yuanying2',
        name: '元婴修真境2',
        desc: '元婴之境，气势恢宏。',
        exits: { south: 'entry', north: 'boss_yuanying' },
        spawns: ['cultivation_yuanying_1', 'cultivation_yuanying_2', 'cultivation_yuanying_3', 'cultivation_yuanying_4', 'cultivation_yuanying_5'],
        minCultivationLevel: 3
      },
      field_yuanying3: {
        id: 'field_yuanying3',
        name: '元婴修真境3',
        desc: '元婴之境，气势恢宏。',
        exits: { south: 'entry', north: 'boss_yuanying' },
        spawns: ['cultivation_yuanying_1', 'cultivation_yuanying_2', 'cultivation_yuanying_3', 'cultivation_yuanying_4', 'cultivation_yuanying_5'],
        minCultivationLevel: 3
      },
      boss_yuanying: {
        id: 'boss_yuanying',
        name: '元婴魔宫',
        desc: '元婴魔君在此。',
        exits: { south: 'field_yuanying' },
        spawns: ['cultivation_boss_yuanying'],
        minCultivationLevel: 3
      },
      field_kongming: {
        id: 'field_kongming',
        name: '空冥修真境',
        desc: '空冥之境，万籁俱寂。',
        exits: { south: 'entry', north: 'boss_kongming' },
        spawns: ['cultivation_kongming_1', 'cultivation_kongming_2', 'cultivation_kongming_3', 'cultivation_kongming_4', 'cultivation_kongming_5'],
        minCultivationLevel: 4
      },
      field_kongming1: {
        id: 'field_kongming1',
        name: '空冥修真境1',
        desc: '空冥之境，万籁俱寂。',
        exits: { south: 'entry', north: 'boss_kongming' },
        spawns: ['cultivation_kongming_1', 'cultivation_kongming_2', 'cultivation_kongming_3', 'cultivation_kongming_4', 'cultivation_kongming_5'],
        minCultivationLevel: 4
      },
      field_kongming2: {
        id: 'field_kongming2',
        name: '空冥修真境2',
        desc: '空冥之境，万籁俱寂。',
        exits: { south: 'entry', north: 'boss_kongming' },
        spawns: ['cultivation_kongming_1', 'cultivation_kongming_2', 'cultivation_kongming_3', 'cultivation_kongming_4', 'cultivation_kongming_5'],
        minCultivationLevel: 4
      },
      field_kongming3: {
        id: 'field_kongming3',
        name: '空冥修真境3',
        desc: '空冥之境，万籁俱寂。',
        exits: { south: 'entry', north: 'boss_kongming' },
        spawns: ['cultivation_kongming_1', 'cultivation_kongming_2', 'cultivation_kongming_3', 'cultivation_kongming_4', 'cultivation_kongming_5'],
        minCultivationLevel: 4
      },
      boss_kongming: {
        id: 'boss_kongming',
        name: '空冥魔宫',
        desc: '空冥魔君镇压一方。',
        exits: { south: 'field_kongming' },
        spawns: ['cultivation_boss_kongming'],
        minCultivationLevel: 4
      },
      field_lvshuang: {
        id: 'field_lvshuang',
        name: '履霜修真境',
        desc: '履霜之境，寒意凛冽。',
        exits: { south: 'entry', north: 'boss_lvshuang' },
        spawns: ['cultivation_lvshuang_1', 'cultivation_lvshuang_2', 'cultivation_lvshuang_3', 'cultivation_lvshuang_4', 'cultivation_lvshuang_5'],
        minCultivationLevel: 5
      },
      field_lvshuang1: {
        id: 'field_lvshuang1',
        name: '履霜修真境1',
        desc: '履霜之境，寒意凛冽。',
        exits: { south: 'entry', north: 'boss_lvshuang' },
        spawns: ['cultivation_lvshuang_1', 'cultivation_lvshuang_2', 'cultivation_lvshuang_3', 'cultivation_lvshuang_4', 'cultivation_lvshuang_5'],
        minCultivationLevel: 5
      },
      field_lvshuang2: {
        id: 'field_lvshuang2',
        name: '履霜修真境2',
        desc: '履霜之境，寒意凛冽。',
        exits: { south: 'entry', north: 'boss_lvshuang' },
        spawns: ['cultivation_lvshuang_1', 'cultivation_lvshuang_2', 'cultivation_lvshuang_3', 'cultivation_lvshuang_4', 'cultivation_lvshuang_5'],
        minCultivationLevel: 5
      },
      field_lvshuang3: {
        id: 'field_lvshuang3',
        name: '履霜修真境3',
        desc: '履霜之境，寒意凛冽。',
        exits: { south: 'entry', north: 'boss_lvshuang' },
        spawns: ['cultivation_lvshuang_1', 'cultivation_lvshuang_2', 'cultivation_lvshuang_3', 'cultivation_lvshuang_4', 'cultivation_lvshuang_5'],
        minCultivationLevel: 5
      },
      boss_lvshuang: {
        id: 'boss_lvshuang',
        name: '履霜魔宫',
        desc: '履霜魔君驻守。',
        exits: { south: 'field_lvshuang' },
        spawns: ['cultivation_boss_lvshuang'],
        minCultivationLevel: 5
      },
      field_dujie: {
        id: 'field_dujie',
        name: '渡劫修真境',
        desc: '渡劫之境，雷火交织。',
        exits: { south: 'entry', north: 'boss_dujie' },
        spawns: ['cultivation_dujie_1', 'cultivation_dujie_2', 'cultivation_dujie_3', 'cultivation_dujie_4', 'cultivation_dujie_5'],
        minCultivationLevel: 6
      },
      field_dujie1: {
        id: 'field_dujie1',
        name: '渡劫修真境1',
        desc: '渡劫之境，雷火交织。',
        exits: { south: 'entry', north: 'boss_dujie' },
        spawns: ['cultivation_dujie_1', 'cultivation_dujie_2', 'cultivation_dujie_3', 'cultivation_dujie_4', 'cultivation_dujie_5'],
        minCultivationLevel: 6
      },
      field_dujie2: {
        id: 'field_dujie2',
        name: '渡劫修真境2',
        desc: '渡劫之境，雷火交织。',
        exits: { south: 'entry', north: 'boss_dujie' },
        spawns: ['cultivation_dujie_1', 'cultivation_dujie_2', 'cultivation_dujie_3', 'cultivation_dujie_4', 'cultivation_dujie_5'],
        minCultivationLevel: 6
      },
      field_dujie3: {
        id: 'field_dujie3',
        name: '渡劫修真境3',
        desc: '渡劫之境，雷火交织。',
        exits: { south: 'entry', north: 'boss_dujie' },
        spawns: ['cultivation_dujie_1', 'cultivation_dujie_2', 'cultivation_dujie_3', 'cultivation_dujie_4', 'cultivation_dujie_5'],
        minCultivationLevel: 6
      },
      boss_dujie: {
        id: 'boss_dujie',
        name: '渡劫魔宫',
        desc: '渡劫魔君震慑四方。',
        exits: { south: 'field_dujie' },
        spawns: ['cultivation_boss_dujie'],
        minCultivationLevel: 6
      },
      field_jimie: {
        id: 'field_jimie',
        name: '寂灭修真境',
        desc: '寂灭之境，生机涌动。',
        exits: { south: 'entry', north: 'boss_jimie' },
        spawns: ['cultivation_jimie_1', 'cultivation_jimie_2', 'cultivation_jimie_3', 'cultivation_jimie_4', 'cultivation_jimie_5'],
        minCultivationLevel: 7
      },
      field_jimie1: {
        id: 'field_jimie1',
        name: '寂灭修真境1',
        desc: '寂灭之境，生机涌动。',
        exits: { south: 'entry', north: 'boss_jimie' },
        spawns: ['cultivation_jimie_1', 'cultivation_jimie_2', 'cultivation_jimie_3', 'cultivation_jimie_4', 'cultivation_jimie_5'],
        minCultivationLevel: 7
      },
      field_jimie2: {
        id: 'field_jimie2',
        name: '寂灭修真境2',
        desc: '寂灭之境，生机涌动。',
        exits: { south: 'entry', north: 'boss_jimie' },
        spawns: ['cultivation_jimie_1', 'cultivation_jimie_2', 'cultivation_jimie_3', 'cultivation_jimie_4', 'cultivation_jimie_5'],
        minCultivationLevel: 7
      },
      field_jimie3: {
        id: 'field_jimie3',
        name: '寂灭修真境3',
        desc: '寂灭之境，生机涌动。',
        exits: { south: 'entry', north: 'boss_jimie' },
        spawns: ['cultivation_jimie_1', 'cultivation_jimie_2', 'cultivation_jimie_3', 'cultivation_jimie_4', 'cultivation_jimie_5'],
        minCultivationLevel: 7
      },
      boss_jimie: {
        id: 'boss_jimie',
        name: '寂灭魔宫',
        desc: '寂灭魔君坐镇。',
        exits: { south: 'field_jimie' },
        spawns: ['cultivation_boss_jimie'],
        minCultivationLevel: 7
      },
      field_dacheng: {
        id: 'field_dacheng',
        name: '大乘修真境',
        desc: '大乘之境，万象归一。',
        exits: { south: 'entry', north: 'boss_dacheng' },
        spawns: ['cultivation_dacheng_1', 'cultivation_dacheng_2', 'cultivation_dacheng_3', 'cultivation_dacheng_4', 'cultivation_dacheng_5'],
        minCultivationLevel: 8
      },
      field_dacheng1: {
        id: 'field_dacheng1',
        name: '大乘修真境1',
        desc: '大乘之境，万象归一。',
        exits: { south: 'entry', north: 'boss_dacheng' },
        spawns: ['cultivation_dacheng_1', 'cultivation_dacheng_2', 'cultivation_dacheng_3', 'cultivation_dacheng_4', 'cultivation_dacheng_5'],
        minCultivationLevel: 8
      },
      field_dacheng2: {
        id: 'field_dacheng2',
        name: '大乘修真境2',
        desc: '大乘之境，万象归一。',
        exits: { south: 'entry', north: 'boss_dacheng' },
        spawns: ['cultivation_dacheng_1', 'cultivation_dacheng_2', 'cultivation_dacheng_3', 'cultivation_dacheng_4', 'cultivation_dacheng_5'],
        minCultivationLevel: 8
      },
      field_dacheng3: {
        id: 'field_dacheng3',
        name: '大乘修真境3',
        desc: '大乘之境，万象归一。',
        exits: { south: 'entry', north: 'boss_dacheng' },
        spawns: ['cultivation_dacheng_1', 'cultivation_dacheng_2', 'cultivation_dacheng_3', 'cultivation_dacheng_4', 'cultivation_dacheng_5'],
        minCultivationLevel: 8
      },
      boss_dacheng: {
        id: 'boss_dacheng',
        name: '大乘魔宫',
        desc: '大乘魔君盘踞。',
        exits: { south: 'field_dacheng' },
        spawns: ['cultivation_boss_dacheng'],
        minCultivationLevel: 8
      },
      field_shangxian: {
        id: 'field_shangxian',
        name: '上仙修真境',
        desc: '上仙之境，仙气缭绕。',
        exits: { south: 'entry', north: 'boss_shangxian' },
        spawns: ['cultivation_shangxian_1', 'cultivation_shangxian_2', 'cultivation_shangxian_3', 'cultivation_shangxian_4', 'cultivation_shangxian_5'],
        minCultivationLevel: 9
      },
      field_shangxian1: {
        id: 'field_shangxian1',
        name: '上仙修真境1',
        desc: '上仙之境，仙气缭绕。',
        exits: { south: 'entry', north: 'boss_shangxian' },
        spawns: ['cultivation_shangxian_1', 'cultivation_shangxian_2', 'cultivation_shangxian_3', 'cultivation_shangxian_4', 'cultivation_shangxian_5'],
        minCultivationLevel: 9
      },
      field_shangxian2: {
        id: 'field_shangxian2',
        name: '上仙修真境2',
        desc: '上仙之境，仙气缭绕。',
        exits: { south: 'entry', north: 'boss_shangxian' },
        spawns: ['cultivation_shangxian_1', 'cultivation_shangxian_2', 'cultivation_shangxian_3', 'cultivation_shangxian_4', 'cultivation_shangxian_5'],
        minCultivationLevel: 9
      },
      field_shangxian3: {
        id: 'field_shangxian3',
        name: '上仙修真境3',
        desc: '上仙之境，仙气缭绕。',
        exits: { south: 'entry', north: 'boss_shangxian' },
        spawns: ['cultivation_shangxian_1', 'cultivation_shangxian_2', 'cultivation_shangxian_3', 'cultivation_shangxian_4', 'cultivation_shangxian_5'],
        minCultivationLevel: 9
      },
      boss_shangxian: {
        id: 'boss_shangxian',
        name: '上仙魔宫',
        desc: '上仙魔君镇守。',
        exits: { south: 'field_shangxian' },
        spawns: ['cultivation_boss_shangxian'],
        minCultivationLevel: 9
      },
      field_zhenxian: {
        id: 'field_zhenxian',
        name: '真仙修真境',
        desc: '真仙之境，浩瀚无垠。',
        exits: { south: 'entry', north: 'boss_zhenxian' },
        spawns: ['cultivation_zhenxian_1', 'cultivation_zhenxian_2', 'cultivation_zhenxian_3', 'cultivation_zhenxian_4', 'cultivation_zhenxian_5'],
        minCultivationLevel: 10
      },
      field_zhenxian1: {
        id: 'field_zhenxian1',
        name: '真仙修真境1',
        desc: '真仙之境，浩瀚无垠。',
        exits: { south: 'entry', north: 'boss_zhenxian' },
        spawns: ['cultivation_zhenxian_1', 'cultivation_zhenxian_2', 'cultivation_zhenxian_3', 'cultivation_zhenxian_4', 'cultivation_zhenxian_5'],
        minCultivationLevel: 10
      },
      field_zhenxian2: {
        id: 'field_zhenxian2',
        name: '真仙修真境2',
        desc: '真仙之境，浩瀚无垠。',
        exits: { south: 'entry', north: 'boss_zhenxian' },
        spawns: ['cultivation_zhenxian_1', 'cultivation_zhenxian_2', 'cultivation_zhenxian_3', 'cultivation_zhenxian_4', 'cultivation_zhenxian_5'],
        minCultivationLevel: 10
      },
      field_zhenxian3: {
        id: 'field_zhenxian3',
        name: '真仙修真境3',
        desc: '真仙之境，浩瀚无垠。',
        exits: { south: 'entry', north: 'boss_zhenxian' },
        spawns: ['cultivation_zhenxian_1', 'cultivation_zhenxian_2', 'cultivation_zhenxian_3', 'cultivation_zhenxian_4', 'cultivation_zhenxian_5'],
        minCultivationLevel: 10
      },
      boss_zhenxian: {
        id: 'boss_zhenxian',
        name: '真仙魔宫',
        desc: '真仙魔君出没于此。',
        exits: { south: 'field_zhenxian' },
        spawns: ['cultivation_boss_zhenxian'],
        minCultivationLevel: 10
      },
      field_tianxian: {
        id: 'field_tianxian',
        name: '天仙修真境',
        desc: '天仙之境，仙光万丈。',
        exits: { south: 'entry', north: 'boss_tianxian' },
        spawns: ['cultivation_tianxian_1', 'cultivation_tianxian_2', 'cultivation_tianxian_3', 'cultivation_tianxian_4', 'cultivation_tianxian_5'],
        minCultivationLevel: 11
      },
      field_tianxian1: {
        id: 'field_tianxian1',
        name: '天仙修真境1',
        desc: '天仙之境，仙光万丈。',
        exits: { south: 'entry', north: 'boss_tianxian' },
        spawns: ['cultivation_tianxian_1', 'cultivation_tianxian_2', 'cultivation_tianxian_3', 'cultivation_tianxian_4', 'cultivation_tianxian_5'],
        minCultivationLevel: 11
      },
      field_tianxian2: {
        id: 'field_tianxian2',
        name: '天仙修真境2',
        desc: '天仙之境，仙光万丈。',
        exits: { south: 'entry', north: 'boss_tianxian' },
        spawns: ['cultivation_tianxian_1', 'cultivation_tianxian_2', 'cultivation_tianxian_3', 'cultivation_tianxian_4', 'cultivation_tianxian_5'],
        minCultivationLevel: 11
      },
      field_tianxian3: {
        id: 'field_tianxian3',
        name: '天仙修真境3',
        desc: '天仙之境，仙光万丈。',
        exits: { south: 'entry', north: 'boss_tianxian' },
        spawns: ['cultivation_tianxian_1', 'cultivation_tianxian_2', 'cultivation_tianxian_3', 'cultivation_tianxian_4', 'cultivation_tianxian_5'],
        minCultivationLevel: 11
      },
      boss_tianxian: {
        id: 'boss_tianxian',
        name: '天仙魔宫',
        desc: '天仙魔君镇压此境。',
        exits: { south: 'field_tianxian' },
        spawns: ['cultivation_boss_tianxian'],
        minCultivationLevel: 11
      }
    }
  }
};

function formatTowerFloor(value) {
  return String(value).padStart(2, '0');
}

function towerFloorRoomId(floor) {
  return `floor_${formatTowerFloor(floor)}_x`;
}

function normalizeTowerFloorValue(value) {
  const floor = Math.floor(Number(value) || 0);
  return floor > 0 ? floor : 1;
}

function towerFloorFromRoomId(roomId) {
  const match = String(roomId || '').match(/^floor_(\d+)_x(?:__u_(.+))?$/);
  if (!match) return 0;
  return normalizeTowerFloorValue(match[1]);
}

function towerOwnerKeyFromRoomId(roomId) {
  const match = String(roomId || '').match(/^floor_(\d+)_x(?:__u_(.+))?$/);
  if (!match) return '';
  return (match[2] || '').trim();
}

function towerFloorRoomInstanceId(floor, ownerKey = '') {
  const base = towerFloorRoomId(floor);
  const owner = String(ownerKey || '').trim();
  return owner ? `${base}__u_${owner}` : base;
}

function buildZhuxianTowerRoom(floor, ownerKey = '') {
  const normalizedFloor = normalizeTowerFloorValue(floor);
  const roomId = towerFloorRoomInstanceId(normalizedFloor, ownerKey);
  const isBossFloor = normalizedFloor % 10 === 0;
  return {
    id: roomId,
    name: `浮图塔第${normalizedFloor}层`,
    desc: isBossFloor
      ? `浮图塔第${normalizedFloor}层，镇层魔君坐镇，击败后方可继续登塔。`
      : `塔内灵压沉重，第${normalizedFloor}层妖灵盘踞。`,
    exits: {
      south: 'entry',
      north: towerFloorRoomInstanceId(normalizedFloor + 1, ownerKey)
    },
    spawns: isBossFloor
      ? ['zxft_boss']
      : ['zxft_mob_1', 'zxft_mob_2', 'zxft_mob_3', 'zxft_mob_4', 'zxft_mob_5'],
    towerFloor: normalizedFloor,
    towerBossFloor: isBossFloor,
    towerOwnerKey: String(ownerKey || '').trim() || null
  };
}

function personalBossOwnerKeyFromRoomId(roomId) {
  const match = String(roomId || '').match(/^(vip_lair|svip_lair|perma_lair)(?:__u_(.+))?$/);
  if (!match) return '';
  return (match[2] || '').trim();
}

function personalBossBaseRoomId(roomId) {
  const match = String(roomId || '').match(/^(vip_lair|svip_lair|perma_lair)(?:__u_(.+))?$/);
  if (!match) return '';
  return match[1];
}

function personalBossRoomInstanceId(baseRoomId, ownerKey = '') {
  const base = String(baseRoomId || '').trim();
  const owner = String(ownerKey || '').trim();
  if (!base) return '';
  return owner ? `${base}__u_${owner}` : base;
}

function buildPersonalBossRoom(baseRoomId, ownerKey = '') {
  const base = String(baseRoomId || '').trim();
  const roomId = personalBossRoomInstanceId(base, ownerKey);
  let name = '专属BOSS';
  let desc = '个人专属BOSS房间。';
  let tier = 'vip';
  let spawns = ['vip_personal_boss'];
  if (base === 'svip_lair') {
    name = 'SVIP专属BOSS';
    desc = 'SVIP专属BOSS房间，仅允许本人进入。';
    tier = 'svip';
    spawns = ['svip_personal_boss'];
  } else if (base === 'perma_lair') {
    name = 'SVIP永久专属BOSS';
    desc = 'SVIP永久专属BOSS房间，仅允许本人进入。';
    tier = 'svip_permanent';
    spawns = ['svip_personal_boss'];
  } else {
    name = 'VIP专属BOSS';
    desc = 'VIP专属BOSS房间，仅允许本人进入。';
    tier = 'vip';
    spawns = ['vip_personal_boss'];
  }
  return {
    id: roomId,
    name,
    desc,
    exits: { south: 'entry' },
    spawns,
    personalBossTier: tier,
    personalBossOwnerKey: String(ownerKey || '').trim() || null
  };
}

export function ensureZhuxianTowerRoom(worldOrRoomId, maybeRoomId) {
  const world = maybeRoomId === undefined ? WORLD : worldOrRoomId;
  const roomValue = maybeRoomId === undefined ? worldOrRoomId : maybeRoomId;
  const zone = world?.zxft;
  if (!zone || !zone.rooms) return null;
  const floor = typeof roomValue === 'number'
    ? normalizeTowerFloorValue(roomValue)
    : towerFloorFromRoomId(roomValue);
  const ownerKey = typeof roomValue === 'string'
    ? towerOwnerKeyFromRoomId(roomValue)
    : '';
  if (!floor) return null;
  const roomId = towerFloorRoomInstanceId(floor, ownerKey);
  if (!zone.rooms[roomId]) {
    zone.rooms[roomId] = buildZhuxianTowerRoom(floor, ownerKey);
  }
  return roomId;
}

export function ensurePersonalBossRoom(worldOrRoomId, maybeRoomId) {
  const world = maybeRoomId === undefined ? WORLD : worldOrRoomId;
  const roomValue = maybeRoomId === undefined ? worldOrRoomId : maybeRoomId;
  const zone = world?.pboss;
  if (!zone || !zone.rooms) return null;
  const baseRoomId = personalBossBaseRoomId(roomValue);
  if (!baseRoomId) return null;
  const ownerKey = typeof roomValue === 'string' ? personalBossOwnerKeyFromRoomId(roomValue) : '';
  const roomId = personalBossRoomInstanceId(baseRoomId, ownerKey);
  if (!zone.rooms[roomId]) {
    zone.rooms[roomId] = buildPersonalBossRoom(baseRoomId, ownerKey);
  }
  return roomId;
}

ensureZhuxianTowerRoom(WORLD, 1);

export function expandRoomVariants(world) {
  const extraCount = Math.max(0, ROOM_VARIANT_COUNT - 3);
  if (!extraCount) return;
  const extraSuffixes = Array.from({ length: extraCount }, (_, idx) => idx + 4);
  const baseByZone = new Map();
  Object.entries(world).forEach(([zoneId, zone]) => {
    if (!zone?.rooms) return;
    // 跳过暗之BOSS区域，不为其创建变种
    if (zoneId === 'dark_bosses') return;
    const baseMap = new Map();
    Object.keys(zone.rooms).forEach((roomId) => {
      const match = roomId.match(/^(.*?)([1-3])$/);
      if (!match) return;
      const baseId = match[1];
      if (!baseMap.has(baseId)) {
        baseMap.set(baseId, roomId);
      }
    });
    if (baseMap.size) {
      baseByZone.set(zoneId, baseMap);
    }
  });

  const replaceSuffix = (value, target) => {
    if (typeof value !== 'string') return value;
    return value.replace(/([1-3])$/, String(target));
  };

  baseByZone.forEach((baseMap, zoneId) => {
    const zone = world[zoneId];
    baseMap.forEach((templateId, baseId) => {
      const template = zone.rooms[templateId];
      if (!template) return;
      // 跳过修真BOSS房间的变种创建（BOSS房间保持唯一）
      if (baseId.startsWith('boss_')) return;
      extraSuffixes.forEach((suffix) => {
        const newRoomId = `${baseId}${suffix}`;
        if (zone.rooms[newRoomId]) return;
        const cloned = JSON.parse(JSON.stringify(template));
        cloned.id = replaceSuffix(cloned.id, suffix);
        cloned.name = replaceSuffix(cloned.name, suffix);
        if (cloned.exits && typeof cloned.exits === 'object') {
          Object.keys(cloned.exits).forEach((dir) => {
            const dest = cloned.exits[dir];
            if (typeof dest !== 'string') return;
            // 修真练级地图的BOSS出口保持指向唯一的BOSS房间，不加后缀
            if (dest.startsWith('boss_')) {
              cloned.exits[dir] = dest;
            } else if (dest.includes(':')) {
              const [destZone, destRoom] = dest.split(':');
              cloned.exits[dir] = `${destZone}:${replaceSuffix(destRoom, suffix)}`;
            } else {
              cloned.exits[dir] = replaceSuffix(dest, suffix);
            }
          });
        }
        zone.rooms[newRoomId] = cloned;
      });
    });
  });

  Object.values(world).forEach((zone) => {
    if (!zone?.rooms) return;
    Object.values(zone.rooms).forEach((room) => {
      if (!room?.exits) return;
      const nextExits = { ...room.exits };
      Object.entries(room.exits).forEach(([dir, dest]) => {
        const match = dir.match(/^(.*?)([1-3])$/);
        if (!match) return;
        const baseDir = match[1];
        extraSuffixes.forEach((suffix) => {
          const newDir = `${baseDir}${suffix}`;
          if (nextExits[newDir]) return;
          if (typeof dest !== 'string') return;
          if (dest.includes(':')) {
            const [destZone, destRoom] = dest.split(':');
            const targetRoomId = replaceSuffix(destRoom, suffix);
            // 只有当目标区域存在该变种房间时，才创建对应的出口
            if (world[destZone]?.rooms?.[targetRoomId]) {
              nextExits[newDir] = `${destZone}:${targetRoomId}`;
            }
          } else {
            const targetRoomId = replaceSuffix(dest, suffix);
            // 只有当目标区域存在该变种房间时，才创建对应的出口
            if (zone.rooms?.[targetRoomId]) {
              nextExits[newDir] = targetRoomId;
            }
          }
        });
      });
      room.exits = nextExits;
    });
  });

  // 特殊处理：为修真BOSS房间添加所有变种练级地图的出口
  const cultivationZone = world['cultivation'];
  if (cultivationZone && cultivationZone.rooms) {
    const bossRoomIds = [
      'boss_zhuji', 'boss_lingxu', 'boss_hehe', 'boss_yuanying',
      'boss_kongming', 'boss_lvshuang', 'boss_dujie', 'boss_jimie',
      'boss_dacheng', 'boss_shangxian', 'boss_zhenxian', 'boss_tianxian'
    ];

    bossRoomIds.forEach(bossRoomId => {
      const bossRoom = cultivationZone.rooms[bossRoomId];
      if (!bossRoom || !bossRoom.exits) return;

      // 找到BOSS房间对应的练级地图基础ID
      const baseFieldId = bossRoomId.replace('boss_', 'field_');
      if (!cultivationZone.rooms[baseFieldId]) return;

      // 为BOSS房间添加所有变种练级地图的出口
      const exits = { ...bossRoom.exits };
      // 添加所有变种的south出口（south1, south2, south3等）
      for (let i = 1; i <= ROOM_VARIANT_COUNT; i++) {
        const variantFieldId = `${baseFieldId}${i}`;
        if (cultivationZone.rooms[variantFieldId]) {
          exits[`south${i}`] = variantFieldId;
        }
      }
      bossRoom.exits = exits;
    });

    // 特殊处理：为修真入口添加所有变种练级地图和BOSS房间的出口
    const entryRoom = cultivationZone.rooms['entry'];
    if (entryRoom && entryRoom.exits) {
      const exits = { ...entryRoom.exits };

      // 为每个练级地图添加变种出口
      const fieldIds = [
        'field_zhuji', 'field_lingxu', 'field_hehe', 'field_yuanying',
        'field_kongming', 'field_lvshuang', 'field_dujie', 'field_jimie',
        'field_dacheng', 'field_shangxian', 'field_zhenxian', 'field_tianxian'
      ];

      fieldIds.forEach(fieldId => {
        if (!cultivationZone.rooms[fieldId]) return;
        for (let i = 1; i <= ROOM_VARIANT_COUNT; i++) {
          const variantFieldId = `${fieldId}${i}`;
          if (cultivationZone.rooms[variantFieldId]) {
            exits[variantFieldId] = variantFieldId;
          }
        }
      });

      entryRoom.exits = exits;
    }
  }
}

export function shrinkRoomVariants(world, maxCount) {
  const limit = Math.max(1, Math.floor(Number(maxCount) || 1));
  const removedRoomsByZone = new Map();

  Object.entries(world).forEach(([zoneId, zone]) => {
    if (!zone?.rooms) return;
    const toRemove = new Set();
    Object.keys(zone.rooms).forEach((roomId) => {
      const match = roomId.match(/^(.*?)(\d+)$/);
      if (!match) return;
      const suffix = parseInt(match[2], 10);
      if (Number.isFinite(suffix) && suffix > limit) {
        toRemove.add(roomId);
      }
    });
    if (toRemove.size) {
      toRemove.forEach((roomId) => delete zone.rooms[roomId]);
      removedRoomsByZone.set(zoneId, toRemove);
    }
  });

  Object.entries(world).forEach(([zoneId, zone]) => {
    if (!zone?.rooms) return;
    Object.values(zone.rooms).forEach((room) => {
      if (!room?.exits) return;
      const nextExits = { ...room.exits };
      Object.entries(room.exits).forEach(([dir, dest]) => {
        const dirMatch = dir.match(/^(.*?)(\d+)$/);
        if (dirMatch) {
          const suffix = parseInt(dirMatch[2], 10);
          if (Number.isFinite(suffix) && suffix > limit) {
            delete nextExits[dir];
            return;
          }
        }
        if (typeof dest !== 'string') return;
        const target = dest.includes(':') ? dest.split(':')[1] : dest;
        const targetMatch = target.match(/^(.*?)(\d+)$/);
        if (targetMatch) {
          const suffix = parseInt(targetMatch[2], 10);
          if (Number.isFinite(suffix) && suffix > limit) {
            delete nextExits[dir];
            return;
          }
        }
        if (dest.includes(':')) {
          const [destZone, destRoom] = dest.split(':');
          const destZoneRooms = world[destZone]?.rooms;
          if (!destZoneRooms || !destZoneRooms[destRoom]) {
            delete nextExits[dir];
          }
        } else if (!zone.rooms[dest]) {
          delete nextExits[dir];
        }
      });
      room.exits = nextExits;
    });
  });

  // 特殊处理：从修真BOSS房间中删除已移除变种练级地图的出口
  const cultivationZone = world['cultivation'];
  if (cultivationZone && cultivationZone.rooms) {
    const bossRoomIds = [
      'boss_zhuji', 'boss_lingxu', 'boss_hehe', 'boss_yuanying',
      'boss_kongming', 'boss_lvshuang', 'boss_dujie', 'boss_jimie',
      'boss_dacheng', 'boss_shangxian', 'boss_zhenxian', 'boss_tianxian'
    ];

    bossRoomIds.forEach(bossRoomId => {
      const bossRoom = cultivationZone.rooms[bossRoomId];
      if (!bossRoom || !bossRoom.exits) return;

      // 移除超过限制的变种出口
      const exits = { ...bossRoom.exits };
      for (let i = limit + 1; i <= ROOM_VARIANT_COUNT; i++) {
        delete exits[`south${i}`];
      }
      bossRoom.exits = exits;
    });

    // 特殊处理：从修真入口中删除已移除变种练级地图的出口
    const entryRoom = cultivationZone.rooms['entry'];
    if (entryRoom && entryRoom.exits) {
      const exits = { ...entryRoom.exits };

      // 移除超过限制的变种出口
      const fieldIds = [
        'field_zhuji', 'field_lingxu', 'field_hehe', 'field_yuanying',
        'field_kongming', 'field_lvshuang', 'field_dujie', 'field_jimie',
        'field_dacheng', 'field_shangxian', 'field_zhenxian', 'field_tianxian'
      ];

      fieldIds.forEach(fieldId => {
        for (let i = limit + 1; i <= ROOM_VARIANT_COUNT; i++) {
          const variantFieldId = `${fieldId}${i}`;
          delete exits[variantFieldId];
        }
      });

      entryRoom.exits = exits;
    }
  }
}

expandRoomVariants(WORLD);

export const NPCS = {
  guard: {
    id: 'guard',
    name: '城门守卫',
    dialog: '新手可以去城外平原历练，小心别走太远。'
  },
  shopkeeper: {
    id: 'shopkeeper',
    name: '杂货商人',
    dialog: '药水与补给齐全，路上好好保命。'
  },
  blacksmith: {
    id: 'blacksmith',
    name: '铁匠',
    dialog: '要更锋利的兵器吗？我这儿有。'
  },
  tao_master: {
    id: 'tao_master',
    name: '道士师傅',
    dialog: '阴阳相济方得正道。'
  },
  mage_master: {
    id: 'mage_master',
    name: '法师导师',
    dialog: '专注才能驾驭法力。'
  },
  sailor: {
    id: 'sailor',
    name: '船夫',
    dialog: '去苍月岛吗？这趟航行不便宜。'
  }
};
