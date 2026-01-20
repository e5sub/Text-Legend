export const WORLD = {
  bq_town: {
    id: 'bq_town',
    name: '比奇城',
    rooms: {
      gate: {
        id: 'gate',
        name: '城门',
        desc: '守卫盯着大道，行人络绎不绝。',
        exits: { north: 'bq_plains:plains', east: 'market' },
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
        spawns: ['chicken', 'deer', 'sheep', 'scarecrow']
      },
      forest: {
        id: 'forest',
        name: '林地',
        desc: '高树投下阴影，狼群在这里潜伏。',
        exits: { south: 'plains', north: 'ruins' },
        spawns: ['wolf', 'bee', 'cat']
      },
      wolfden: {
        id: 'wolfden',
        name: '狼穴',
        desc: '遍地白骨，寒冷的嚎叫回荡。',
        exits: { west: 'plains' },
        spawns: ['wolf', 'wolf', 'wolf']
      },
      ruins: {
        id: 'ruins',
        name: '古代遗迹',
        desc: '残破石块与诡异寂静，骷髅在此游荡。',
        exits: { south: 'forest', north: 'mine:entrance' },
        spawns: ['skeleton', 'skeleton', 'spider']
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
        spawns: ['red_snake', 'tiger_snake']
      },
      deep: {
        id: 'deep',
        name: '山谷深处',
        desc: '阴冷潮湿，邪恶毒蛇盘踞。',
        exits: { south: 'entrance', north: 'mine:entrance' },
        spawns: ['red_snake', 'tiger_snake', 'evil_snake']
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
        spawns: ['zombie', 'elec_zombie', 'craw_zombie']
      },
      depths: {
        id: 'depths',
        name: '矿区深处',
        desc: '腐臭弥漫，怪物更加凶残。',
        exits: { south: 'entrance', north: 'wgc:entrance' },
        spawns: ['zombie', 'black_worm', 'moth', 'cave_bat']
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
        spawns: ['centipede', 'scorpion', 'black_worm']
      },
      deep: {
        id: 'deep',
        name: '蜈蚣洞深处',
        desc: '触龙神盘踞其中。',
        exits: { south: 'entrance', north: 'mg_plains:gate' },
        spawns: ['ghoul', 'bug_queen']
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
        exits: { south: 'wgc:deep', north: 'mg_town:gate', west: 'sm:entrance', east: 'fm:gate', northwest: 'brm:gate', northeast: 'sb_town:gate' },
        spawns: ['half_orc', 'half_orc_warrior']
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
        exits: { south: 'street' },
        spawns: []
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
        spawns: ['pig_red', 'pig_black', 'moth']
      },
      deep: {
        id: 'deep',
        name: '石墓深处',
        desc: '白野猪出没。',
        exits: { south: 'entrance' },
        spawns: ['pig_red', 'pig_black', 'pig_white']
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
        exits: { south: 'mg_plains:gate', north: 'mg_market', west: 'wms:entrance', east: 'zm:hall', northeast: 'cr:valley', northwest: 'wb:lair' },
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
        spawns: ['woma_guard', 'woma_warrior']
      },
      hall: {
        id: 'hall',
        name: '寺庙大厅',
        desc: '沃玛战士在此巡逻。',
        exits: { south: 'entrance', north: 'deep' },
        spawns: ['woma_guard', 'woma_warrior', 'woma_mage']
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
        spawns: ['zuma_archer', 'zuma_guard', 'zuma_statue']
      },
      deep: {
        id: 'deep',
        name: '祖玛深处',
        desc: '祖玛教主的气息在此涌动。',
        exits: { south: 'hall', north: 'throne' },
        spawns: ['zuma_guard', 'zuma_statue']
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
        spawns: ['chiyue_spider', 'chiyue_flower']
      },
      nest: {
        id: 'nest',
        name: '赤月巢穴',
        desc: '血色粘液覆盖墙壁。',
        exits: { south: 'valley', north: 'demon' },
        spawns: ['chiyue_guard', 'chiyue_blood']
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
        spawns: ['ghoul', 'half_orc_elite']
      },
      deep: {
        id: 'deep',
        name: '封魔深处',
        desc: '虹魔教主的地盘。',
        exits: { south: 'gate' },
        spawns: ['fmg_pig', 'fmg_scorpion', 'fmg_demon']
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
        spawns: ['half_orc_elite', 'spider']
      },
      jungle: {
        id: 'jungle',
        name: '丛林深处',
        desc: '千年树妖潜伏其中。',
        exits: { south: 'gate' },
        spawns: ['tree_demon']
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
        spawns: ['bee']
      },
      village: {
        id: 'village',
        name: '苍月村',
        desc: '岛民生活在此，宁静祥和。',
        exits: { south: 'shore', north: 'bone:entrance', east: 'nm_temple:entrance' },
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
        spawns: ['bone_soldier', 'bone_general']
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
        spawns: ['nmmob', 'nm_mage']
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
        spawns: ['molong_guard']
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
};

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
