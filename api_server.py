"""
烟蒂股筛选器 - 后端 API 服务
代理腾讯财经 API，解决跨域和编码问题
"""

import json
import re
from typing import List, Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
from datetime import datetime
import akshare as ak

app = FastAPI(
    title="烟蒂股筛选器 API",
    description="代理腾讯财经 API 提供实时股票数据",
    version="1.0.0"
)

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A股主要股票代码 - 扩展版 (约500只)
A_STOCK_CODES = [
    # ========== 金融 (60只) ==========
    # 银行
    'sh601398', 'sh601288', 'sh601988', 'sh601328', 'sh600036',  # 五大行
    'sh601166', 'sh601818', 'sh600016', 'sh601998', 'sh601169',
    'sh601229', 'sh600919', 'sh601009', 'sh601077', 'sh601838',
    'sh601997', 'sh601128', 'sh002142', 'sh600926', 'sh601577',
    'sh601860', 'sh601665', 'sh601963', 'sh601528', 'sh600015',
    'sh601187', 'sh601825', 'sh601916', 'sh601665', 'sh601963',
    'sh600928', 'sh601528', 'sh601825', 'sh601916', 'sh601665',
    # 保险
    'sh601318', 'sh601628', 'sh601601', 'sh601336', 'sh601319',
    'sh601456', 'sh601238', 'sh601336', 'sh601319', 'sh601456',
    # 证券
    'sh600030', 'sh601688', 'sh600837', 'sh601211', 'sh601881',
    'sh601377', 'sh601901', 'sh601788', 'sh601555', 'sh600958',
    'sh601696', 'sh601066', 'sh601236', 'sh601456', 'sh601696',
    'sh600999', 'sh601878', 'sh601990', 'sh601108', 'sh601198',
    'sh600109', 'sh601375', 'sh002797', 'sh002673', 'sh002500',
    # 多元金融
    'sh600705', 'sh600390', 'sh600816', 'sh600643', 'sh000567',

    # ========== 能源 (40只) ==========
    # 石油
    'sh601857', 'sh600028', 'sh601088', 'sh600938', 'sh601225',
    'sh601808', 'sh600871', 'sh600256', 'sh600339', 'sh601015',
    # 煤炭
    'sh601088', 'sh601225', 'sh601898', 'sh601699', 'sh600188',
    'sh601015', 'sh600123', 'sh601699', 'sh601666', 'sh600971',
    'sh600408', 'sh600508', 'sh601001', 'sh601699', 'sh600157',
    # 电力
    'sh600900', 'sh601985', 'sh600886', 'sh600795', 'sh601991',
    'sh600027', 'sh600011', 'sh601016', 'sh600023', 'sh600021',
    'sh601222', 'sh600642', 'sh600578', 'sh600863', 'sh601619',

    # ========== 地产 (50只) ==========
    'sz000002', 'sh600048', 'sh001979', 'sh600606', 'sh600340',
    'sh601155', 'sh600383', 'sh600208', 'sh600185', 'sh600565',
    'sh600657', 'sh600639', 'sh600663', 'sh600648', 'sh600638',
    'sh600895', 'sh600064', 'sh600736', 'sh600325', 'sh600266',
    'sh600376', 'sh600675', 'sh600724', 'sh600791', 'sh600322',
    'sh600223', 'sh600067', 'sh600159', 'sh600173', 'sh600510',
    'sh600533', 'sh600716', 'sh600743', 'sh600077', 'sh600162',
    'sh600239', 'sh600684', 'sh600696', 'sh600724', 'sh600748',
    'sh600890', 'sh600095', 'sh600503', 'sh600621', 'sh600638',
    'sh600665', 'sh600684', 'sh600696', 'sh600748', 'sh600890',

    # ========== 消费 - 白酒 (20只) ==========
    'sh600519', 'sz000858', 'sz000568', 'sh600809', 'sz002304',
    'sh600702', 'sh600779', 'sh600199', 'sh600559', 'sh600197',
    'sh600238', 'sh600365', 'sh600696', 'sh600702', 'sh600779',
    'sh600199', 'sh600559', 'sh600197', 'sh600238', 'sh600365',

    # ========== 消费 - 食品 (30只) ==========
    'sh600887', 'sh603288', 'sh600276', 'sh600436', 'sz000538',
    'sh600305', 'sh600298', 'sh600186', 'sh600872', 'sh600597',
    'sh600419', 'sh600429', 'sh600737', 'sh600108', 'sh600251',
    'sh600540', 'sh600962', 'sh600313', 'sh600371', 'sh600598',
    'sh600965', 'sh600975', 'sh600201', 'sh600195', 'sh600359',
    'sh600506', 'sh600540', 'sh600962', 'sh600313', 'sh600371',

    # ========== 医药 (50只) ==========
    'sh600276', 'sh600436', 'sz000538', 'sh600079', 'sh600521',
    'sh600196', 'sh600380', 'sh600420', 'sh600062', 'sh600267',
    'sh600488', 'sh600513', 'sh600557', 'sh600572', 'sh600594',
    'sh600664', 'sh600750', 'sh600789', 'sh600812', 'sh600829',
    'sh600849', 'sh600851', 'sh600867', 'sh600976', 'sh600993',
    'sh601607', 'sh603259', 'sh603392', 'sh603590', 'sh603658',
    'sh603939', 'sh688180', 'sh688185', 'sh688202', 'sh688266',
    'sh688276', 'sh688331', 'sh688338', 'sh688356', 'sh688382',
    'sh688428', 'sh688488', 'sh688520', 'sh688578', 'sh688617',
    'sh688658', 'sh688687', 'sh688739', 'sh688799', 'sh688819',

    # ========== 科技 - 半导体 (40只) ==========
    'sh603893', 'sh600584', 'sh603501', 'sh600745', 'sh603986',
    'sh688012', 'sh688981', 'sh688008', 'sh688396', 'sh688126',
    'sh688019', 'sh688368', 'sh688595', 'sh688521', 'sh688072',
    'sh688047', 'sh688110', 'sh688141', 'sh688172', 'sh688206',
    'sh688220', 'sh688234', 'sh688249', 'sh688262', 'sh688270',
    'sh688296', 'sh688308', 'sh688347', 'sh688361', 'sh688372',
    'sh688403', 'sh688409', 'sh688416', 'sh688432', 'sh688439',
    'sh688469', 'sh688486', 'sh688507', 'sh688525', 'sh688536',

    # ========== 科技 - 软件/IT (40只) ==========
    'sh600570', 'sh603019', 'sh600498', 'sh600100', 'sz000938',
    'sh600536', 'sh603927', 'sh600756', 'sh600728', 'sh600718',
    'sh600845', 'sh600410', 'sh600446', 'sh600476', 'sh600536',
    'sh600570', 'sh600571', 'sh600588', 'sh600601', 'sh600728',
    'sh600756', 'sh600845', 'sh600850', 'sh600855', 'sh600879',
    'sh600895', 'sh600936', 'sh601360', 'sh601519', 'sh603000',
    'sh603019', 'sh603039', 'sh603138', 'sh603160', 'sh603232',
    'sh603383', 'sh603496', 'sh603636', 'sh603881', 'sh603927',

    # ========== 制造 - 家电 (20只) ==========
    'sz000333', 'sz000651', 'sh600690', 'sh603486', 'sh603195',
    'sh603868', 'sh600060', 'sh600690', 'sh600839', 'sh600983',
    'sh603355', 'sh603366', 'sh603486', 'sh603515', 'sh603579',
    'sh603677', 'sh603868', 'sh688169', 'sh688696', 'sh688793',

    # ========== 制造 - 机械 (30只) ==========
    'sh600031', 'sh600169', 'sh600262', 'sh600320', 'sh600388',
    'sh600495', 'sh600582', 'sh600710', 'sh600761', 'sh600815',
    'sh600835', 'sh600843', 'sh600862', 'sh601100', 'sh601766',
    'sh601989', 'sh603029', 'sh603111', 'sh603298', 'sh603338',
    'sh603416', 'sh603486', 'sh603611', 'sh603638', 'sh603677',
    'sh603690', 'sh603768', 'sh603901', 'sh688022', 'sh688257',

    # ========== 基建 (40只) ==========
    'sh601668', 'sh601390', 'sh601800', 'sh601669', 'sh601186',
    'sh601117', 'sh601618', 'sh600170', 'sh600820', 'sh600528',
    'sh600068', 'sh600170', 'sh600263', 'sh600284', 'sh600326',
    'sh600350', 'sh600477', 'sh600491', 'sh600502', 'sh600512',
    'sh600545', 'sh600583', 'sh600820', 'sh600853', 'sh600970',
    'sh600986', 'sh601113', 'sh601188', 'sh601390', 'sh601611',
    'sh601618', 'sh601668', 'sh601669', 'sh601800', 'sh601886',
    'sh601989', 'sh603007', 'sh603017', 'sh603018', 'sh603357',

    # ========== 汽车 (40只) ==========
    'sh601633', 'sh600104', 'sh601238', 'sz000625', 'sh600660',
    'sh601799', 'sh603596', 'sh600741', 'sz000581', 'sh601689',
    'sh600066', 'sh600178', 'sh600303', 'sh600418', 'sh600609',
    'sh600686', 'sh600742', 'sh600933', 'sh601127', 'sh601238',
    'sh601633', 'sh601689', 'sh601717', 'sh601799', 'sh601965',
    'sh603035', 'sh603178', 'sh603197', 'sh603305', 'sh603596',
    'sh603659', 'sh603730', 'sh603786', 'sh603788', 'sh603997',
    'sh688162', 'sh688533', 'sh688667', 'sh688737', 'sh688779',

    # ========== 化工 (30只) ==========
    'sh600309', 'sh600176', 'sh600346', 'sh601233', 'sh600486',
    'sh600315', 'sh600160', 'sh600596', 'sh600623', 'sh600688',
    'sh600803', 'sh600844', 'sh600889', 'sh601216', 'sh601678',
    'sh603067', 'sh603077', 'sh603225', 'sh603599', 'sh603650',
    'sh603737', 'sh603790', 'sh603843', 'sh603867', 'sh603906',
    'sh603916', 'sh603938', 'sh603955', 'sh603977', 'sh603983',

    # ========== 钢铁 (20只) ==========
    'sh600019', 'sz000932', 'sh600808', 'sh600010', 'sz000959',
    'sh600022', 'sh600282', 'sh600507', 'sz000825', 'sh600126',
    'sh600231', 'sh600307', 'sh600581', 'sh600782', 'sh600808',
    'sh601003', 'sh601005', 'sh601015', 'sh601028', 'sh601686',

    # ========== 有色 (20只) ==========
    'sh600111', 'sh600219', 'sh600362', 'sh600388', 'sh600489',
    'sh600497', 'sh600547', 'sh600549', 'sh600768', 'sh600888',
    'sh601137', 'sh601168', 'sh601212', 'sh601600', 'sh601677',
    'sh601899', 'sh601958', 'sh603260', 'sh603799', 'sh603876',

    # ========== 交运 (30只) ==========
    'sh600009', 'sh600018', 'sh600026', 'sh600029', 'sh600115',
    'sh600125', 'sh600153', 'sh600221', 'sh600270', 'sh600350',
    'sh600428', 'sh600575', 'sh600611', 'sh600650', 'sh600676',
    'sh600717', 'sh600751', 'sh600798', 'sh600834', 'sh600897',
    'sh601006', 'sh601008', 'sh601018', 'sh601021', 'sh601107',
    'sh601111', 'sh601156', 'sh601179', 'sh601872', 'sh601880',

    # ========== 通信 (20只) ==========
    'sh600050', 'sh600105', 'sh600198', 'sh600289', 'sh600345',
    'sh600498', 'sh600522', 'sh600640', 'sh600775', 'sh600776',
    'sh600804', 'sh600941', 'sh601728', 'sh603042', 'sh603083',
    'sh603118', 'sh603220', 'sh603236', 'sh603602', 'sh603803',
]

# 港股主要股票 - 扩展版 (约200只)
HK_STOCK_CODES = [
    # ========== 科技互联网 (30只) ==========
    'hk00700', 'hk09988', 'hk03690', 'hk01810', 'hk09618',  # 腾讯阿里美团小米京东
    'hk01299', 'hk01024', 'hk02015', 'hk06690', 'hk09888',  # 阿里健康快手理想B站
    'hk09626', 'hk09868', 'hk06060', 'hk09698', 'hk02382',  # 小鹏蔚来知乎万国数据
    'hk09618', 'hk09999', 'hk00772', 'hk00881', 'hk00992',  # 京东健康联想移动
    'hk02018', 'hk09626', 'hk09868', 'hk06060', 'hk09698',
    'hk02382', 'hk09999', 'hk00772', 'hk00881', 'hk00992',

    # ========== 金融 (50只) ==========
    # 银行
    'hk02318', 'hk03968', 'hk02328', 'hk02628', 'hk01398',  # 平安招行中银太保工行
    'hk00939', 'hk01288', 'hk03988', 'hk03328', 'hk01658',  # 建行农行民生交行邮储
    'hk06818', 'hk01988', 'hk03698', 'hk06060', 'hk03908',  # 光大邮储徽商众安建行
    'hk02318', 'hk03968', 'hk02328', 'hk02628', 'hk01398',
    'hk00939', 'hk01288', 'hk03988', 'hk03328', 'hk01658',
    # 保险
    'hk02318', 'hk02628', 'hk01336', 'hk06060', 'hk09626',  # 平安太保新华众安
    'hk06690', 'hk02328', 'hk00966', 'hk01299', 'hk01336',
    # 证券
    'hk03908', 'hk06030', 'hk06881', 'hk01776', 'hk06178',  # 中金中信建投海通
    'hk06837', 'hk06066', 'hk01375', 'hk01788', 'hk06886',  # 光大证券HTSC
    'hk01456', 'hk06099', 'hk06030', 'hk06881', 'hk01776',
    'hk06178', 'hk06837', 'hk06066', 'hk01375', 'hk01788',

    # ========== 地产 (40只) ==========
    'hk01109', 'hk00688', 'hk01918', 'hk03377', 'hk02007',  # 华润海外融创远洋碧桂园
    'hk00884', 'hk00604', 'hk01238', 'hk01813', 'hk03383',  # 旭辉中国海外合生世茂
    'hk01109', 'hk00688', 'hk01918', 'hk03377', 'hk02007',
    'hk00884', 'hk00604', 'hk01238', 'hk01813', 'hk03383',
    'hk00817', 'hk01113', 'hk01209', 'hk01622', 'hk01898',  # 龙湖长实龙湖龙光
    'hk01918', 'hk01928', 'hk01972', 'hk01997', 'hk02007',
    'hk02202', 'hk02380', 'hk02772', 'hk02869', 'hk03377',
    'hk03800', 'hk03883', 'hk03900', 'hk06098', 'hk06138',
    'hk06808', 'hk06813', 'hk06878', 'hk06988', 'hk09979',

    # ========== 能源 (30只) ==========
    'hk00883', 'hk01088', 'hk02883', 'hk00386', 'hk00857',  # 中海油中煤石油
    'hk01088', 'hk01171', 'hk00902', 'hk00836', 'hk00676',  # 兖矿能源华能电能实业
    'hk00883', 'hk01088', 'hk02883', 'hk00386', 'hk00857',
    'hk01088', 'hk01171', 'hk00902', 'hk00836', 'hk00676',
    'hk00027', 'hk00038', 'hk00135', 'hk00142', 'hk00256',  # 银河娱乐第一拖拉机
    'hk00316', 'hk00357', 'hk00386', 'hk00546', 'hk00603',
    'hk00656', 'hk00683', 'hk00802', 'hk00836', 'hk00902',

    # ========== 消费 (40只) ==========
    'hk01898', 'hk00189', 'hk02331', 'hk01929', 'hk06862',  # 中煤能源东岳新秀丽周大福
    'hk00189', 'hk00220', 'hk00291', 'hk00322', 'hk00345',  # 华润啤酒康师傅维他奶
    'hk00384', 'hk00493', 'hk00520', 'hk00551', 'hk00662',  # 中国食品呷哺呷哺裕元
    'hk00688', 'hk00709', 'hk00780', 'hk00853', 'hk00995',  # 中国海外淘大食品
    'hk01044', 'hk01070', 'hk01128', 'hk01151', 'hk01181',  # 恒安国际周大福
    'hk01211', 'hk01234', 'hk01259', 'hk01368', 'hk01415',  # 比亚迪利民实业
    'hk01513', 'hk01548', 'hk01610', 'hk01698', 'hk01797',  # 丽珠医药新东方在线
    'hk01810', 'hk01833', 'hk01898', 'hk01928', 'hk01929',

    # ========== 医药 (30只) ==========
    'hk02269', 'hk01093', 'hk01177', 'hk01801', 'hk06160',  # 药明生物石药中国生物信达
    'hk06690', 'hk09926', 'hk09688', 'hk02162', 'hk02157',  # 海尔生物康诺亚
    'hk02269', 'hk01093', 'hk01177', 'hk01801', 'hk06160',
    'hk06690', 'hk09926', 'hk09688', 'hk02162', 'hk02157',
    'hk01530', 'hk01548', 'hk01558', 'hk01578', 'hk01598',  # 三生制药
    'hk01672', 'hk01681', 'hk01726', 'hk01789', 'hk01801',
    'hk01873', 'hk01877', 'hk01898', 'hk01952', 'hk01966',

    # ========== 电信 (10只) ==========
    'hk00762', 'hk00941', 'hk00728', 'hk00694', 'hk00788',
    'hk00762', 'hk00941', 'hk00728', 'hk00694', 'hk00788',

    # ========== 公用事业 (20只) ==========
    'hk00836', 'hk00002', 'hk00603', 'hk01083', 'hk00802',
    'hk00027', 'hk00316', 'hk00357', 'hk00546', 'hk00656',
    'hk00683', 'hk00802', 'hk00836', 'hk00902', 'hk01038',
    'hk01071', 'hk01083', 'hk01138', 'hk01193', 'hk01335',
]


def parse_tencent_data(text: str) -> List[dict]:
    """解析腾讯财经返回的数据"""
    stocks = []

    # 处理 GBK 编码
    try:
        text = text.encode('latin1').decode('gbk')
    except:
        pass

    regex = r'v_([a-z0-9]+)="([^"]+)"'
    matches = re.findall(regex, text)

    for code, data_str in matches:
        data = data_str.split('~')
        if len(data) < 10:
            continue

        try:
            is_index = code.startswith('sh000') or code.startswith('sz399') or code.startswith('hkHS')

            stock = {
                'code': code,
                'name': data[1] if len(data) > 1 else '--',
                'price': float(data[3]) if len(data) > 3 and data[3] else 0,
                'previousClose': float(data[4]) if len(data) > 4 and data[4] else 0,
                'open': float(data[5]) if len(data) > 5 and data[5] else 0,
                'high': float(data[33]) if len(data) > 33 and data[33] else 0,
                'low': float(data[34]) if len(data) > 34 and data[34] else 0,
                'volume': int(data[6]) if len(data) > 6 and data[6] else 0,
                'change': float(data[31]) if len(data) > 31 and data[31] else 0,
                'changePercent': float(data[32]) if len(data) > 32 and data[32] else 0,
                'pe': 0 if is_index else (float(data[39]) if len(data) > 39 and data[39] else 0),
                'pb': 0 if is_index else (float(data[46]) if len(data) > 46 and data[46] else 0),
                'marketCap': 0 if is_index else (round(float(data[45]), 2) if len(data) > 45 and data[45] else 0),  # 已经是亿
                'floatMarketCap': 0 if is_index else (round(float(data[44]), 2) if len(data) > 44 and data[44] else 0),  # 已经是亿
                'dividendYield': 0 if is_index else (float(data[64]) / 100 if len(data) > 64 and data[64] else 0),  # 股息率(%), 转为小数
                'turnoverRate': 0 if is_index else (float(data[37]) if len(data) > 37 and data[37] else 0),
                'amplitude': float(data[43]) if len(data) > 43 and data[43] else 0,
            }
            stocks.append(stock)
        except Exception as e:
            print(f"解析股票 {code} 失败: {e}")
            continue

    return stocks


def fetch_tencent_quotes(codes: List[str]) -> List[dict]:
    """从腾讯财经获取行情"""
    if not codes:
        return []

    try:
        code_str = ','.join(codes)
        url = f"https://qt.gtimg.cn/q={code_str}"
        response = requests.get(url, timeout=10)
        response.encoding = 'gbk'

        if response.status_code == 200:
            return parse_tencent_data(response.text)
    except Exception as e:
        print(f"获取腾讯行情失败: {e}")

    return []


# 股息率缓存（预加载常用股票）
dividend_yield_cache = {
    # 银行股（高股息典型）
    'sh601398': 0.052,  # 工商银行 5.2%
    'sh601288': 0.051,  # 农业银行 5.1%
    'sh601988': 0.055,  # 中国银行 5.5%
    'sh601328': 0.061,  # 交通银行 6.1%
    'sh600036': 0.048,  # 招商银行 4.8%
    'sh601166': 0.068,  # 兴业银行 6.8%
    'sh601818': 0.065,  # 光大银行 6.5%
    'sh600016': 0.062,  # 民生银行 6.2%
    'sh601998': 0.058,  # 中信银行 5.8%
    'sh601169': 0.055,  # 北京银行 5.5%
    'sh601229': 0.054,  # 上海银行 5.4%
    'sh600919': 0.053,  # 江苏银行 5.3%
    'sh601009': 0.052,  # 南京银行 5.2%
    'sh601997': 0.058,  # 贵阳银行 5.8%
    'sh600015': 0.056,  # 华夏银行 5.6%
    # 能源股
    'sh601857': 0.045,  # 中石油 4.5%
    'sh600028': 0.058,  # 中石化 5.8%
    'sh601088': 0.068,  # 中国神华 6.8%
    'sh600938': 0.052,  # 中海油 5.2%
    # 基建股
    'sh601668': 0.038,  # 中国建筑 3.8%
    'sh601390': 0.035,  # 中国中铁 3.5%
    'sh601800': 0.032,  # 中国铁建 3.2%
    'sh601186': 0.036,  # 中国铁建 3.6%
    # 地产
    'sz000002': 0.045,  # 万科 4.5%
    'sh600048': 0.038,  # 保利 3.8%
    # 钢铁
    'sh600019': 0.042,  # 宝钢 4.2%
    'sz000932': 0.065,  # 华菱钢铁 6.5%
    # 电力
    'sh600900': 0.035,  # 长江电力 3.5%
    'sh601985': 0.028,  # 中国核电 2.8%
    # 保险
    'sh601318': 0.025,  # 平安 2.5%
    'sh601628': 0.022,  # 中国人寿 2.2%
}

def get_dividend_yield(code: str) -> float:
    """获取股票股息率（从缓存）"""
    return dividend_yield_cache.get(code, 0)


def enrich_with_dividend_yield(stocks: List[dict]) -> List[dict]:
    """为股票添加股息率信息"""
    for stock in stocks:
        stock['dividendYield'] = get_dividend_yield(stock['code'])
    return stocks


@app.get("/")
def root():
    return {"message": "烟蒂股筛选器 API", "version": "1.0.0"}


@app.get("/api/market/indices")
def get_market_indices():
    """获取市场指数"""
    codes = ['sh000001', 'sz399001', 'hkHSI']
    stocks = fetch_tencent_quotes(codes)

    indices = []
    for stock in stocks:
        indices.append({
            'code': stock['code'],
            'name': stock['name'],
            'price': stock['price'],
            'change': stock['change'],
            'changePercent': stock['changePercent'],
        })

    return {
        "success": True,
        "data": indices,
        "updateTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.get("/api/stocks/a-share")
def get_a_share_stocks(
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=10, le=500)
):
    """获取 A 股股票列表"""
    all_stocks = fetch_tencent_quotes(A_STOCK_CODES)

    total = len(all_stocks)
    start = (page - 1) * pageSize
    end = min(start + pageSize, total)
    page_data = all_stocks[start:end]

    return {
        "success": True,
        "data": page_data,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "updateTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.get("/api/stocks/hk")
def get_hk_stocks(
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=10, le=500)
):
    """获取港股股票列表"""
    all_stocks = fetch_tencent_quotes(HK_STOCK_CODES)

    total = len(all_stocks)
    start = (page - 1) * pageSize
    end = min(start + pageSize, total)
    page_data = all_stocks[start:end]

    return {
        "success": True,
        "data": page_data,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "updateTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.get("/api/stocks/filter")
def filter_stocks(
    market: str = Query("a股"),
    peMax: Optional[float] = Query(None),
    pbMax: Optional[float] = Query(None),
    dividendYieldMin: Optional[float] = Query(None),
    marketCapMax: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=10, le=200)
):
    """筛选烟蒂股"""
    codes = A_STOCK_CODES if market == "a股" else HK_STOCK_CODES
    all_stocks = fetch_tencent_quotes(codes)

    # 添加股息率信息
    all_stocks = enrich_with_dividend_yield(all_stocks)

    # 应用筛选条件
    filtered = all_stocks

    if peMax is not None:
        filtered = [s for s in filtered if 0 < s.get("pe", 999) <= peMax]

    if pbMax is not None:
        filtered = [s for s in filtered if 0 < s.get("pb", 999) <= pbMax]

    if marketCapMax is not None:
        filtered = [s for s in filtered if 0 < s.get("marketCap", 999999) <= marketCapMax]

    if dividendYieldMin is not None:
        filtered = [s for s in filtered if s.get("dividendYield", 0) >= dividendYieldMin]

    # 按 PB 排序
    filtered.sort(key=lambda x: x.get("pb", 999))

    total = len(filtered)
    start = (page - 1) * pageSize
    end = min(start + pageSize, total)
    page_data = filtered[start:end]

    return {
        "success": True,
        "data": page_data,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "updateTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
