import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Settings, X, Coffee, Flame, Cloud, Heart, Sparkles, Zap, Plus, Trash2, Fish, Play, Square, TrendingUp, Dog, RefreshCw } from 'lucide-react';
import { MASCOTS, pickMascot } from './mascotImages';

const FONTS_LINK = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700;900&family=Noto+Sans+SC:wght@400;700;900&family=ZCOOL+KuaiLe&family=ZCOOL+QingKe+HuangYou&family=Anton&family=Archivo+Black&family=JetBrains+Mono:wght@700&display=swap';

const DEFAULT_ITEMS = [
  { id: 'd1', emoji: '🍬', name: '水果糖', price: 0.5 },
  { id: 'd2', emoji: '🌶️', name: '辣条', price: 2 },
  { id: 'd3', emoji: '🥤', name: '蜜雪冰城', price: 5 },
  { id: 'd4', emoji: '☕', name: '瑞幸咖啡', price: 12 },
  { id: 'd5', emoji: '🍱', name: '一份外卖', price: 30 },
  { id: 'd6', emoji: '🍰', name: '星巴克+蛋糕', price: 80 },
  { id: 'd7', emoji: '🍲', name: '一顿火锅', price: 200 },
  { id: 'd8', emoji: '👟', name: '一双新鞋', price: 500 },
];

const DEFAULT_MILESTONES = [
  { id: 'm1', amount: 50, emoji: '🎯', message: '小目标达成！' },
  { id: 'm2', amount: 200, emoji: '🎉', message: '今天没白干！' },
  { id: 'm3', amount: 500, emoji: '💰', message: '日薪到手！' },
];

const careMessages = [
  '今天的能量透支了，给自己点份甜的吧 🍮',
  '必须加班的话，记得喝口热的暖暖胃 ☕',
  '如果不是非加不可，请放下电脑回家 🏠',
  '你比 KPI 重要太多了 💗',
  '老板不会心疼你，但你要心疼你自己',
  '今天的你已经超额完成了，剩下的明天再说',
  '深呼吸，世界又不会因为你下班而塌掉',
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function calcEarnings(now, settings) {
  const { startTime, endTime, dailySalary, overtimeRate } = settings;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = new Date(now); start.setHours(sh, sm, 0, 0);
  const end = new Date(now); end.setHours(eh, em, 0, 0);
  const workMs = end - start;
  const ratePerMs = dailySalary / workMs;
  const ratePerSec = ratePerMs * 1000;
  let regular = 0, overtime = 0, phase = 'before';
  if (now < start) phase = 'before';
  else if (now < end) { phase = 'working'; regular = (now - start) * ratePerMs; }
  else { phase = 'after'; regular = dailySalary; overtime = (now - end) * ratePerMs * overtimeRate; }
  const progress = Math.max(0, Math.min(1, (now - start) / workMs));
  const remainingMs = Math.max(0, end - now);
  const overtimeMs = Math.max(0, now - end);
  return { regular, overtime, phase, progress, remainingMs, overtimeMs, ratePerSec, start, end };
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function findPurchasingItem(amount, items) {
  if (!items || items.length === 0) return null;
  const sorted = [...items].sort((a, b) => a.price - b.price);
  let best = null;
  for (const item of sorted) {
    if (item.price <= amount) best = item;
    else break;
  }
  if (!best) {
    const cheapest = sorted[0];
    return { ...cheapest, notYet: true, progress: amount / cheapest.price };
  }
  return best;
}

function useNow(interval = 50) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

// ====== 实时金额：闪烁 + 飞气泡 ======
function LiveAmount({ value, theme }) {
  const displayValue = value.toFixed(2);
  const prevRef = useRef(displayValue);
  const [flash, setFlash] = useState(false);
  const [gains, setGains] = useState([]);
  const flashTimerRef = useRef(null);
  
  useEffect(() => {
    if (prevRef.current !== displayValue) {
      const prev = parseFloat(prevRef.current);
      const curr = parseFloat(displayValue);
      const delta = curr - prev;
      if (delta > 0) {
        setFlash(true);
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlash(false), 300);
        const id = Date.now() + Math.random();
        const offset = Math.random() * 60 - 30;
        setGains(g => [...g, { id, amount: delta, offset }]);
        setTimeout(() => setGains(g => g.filter(x => x.id !== id)), 1400);
      }
      prevRef.current = displayValue;
    }
  }, [displayValue]);
  
  return (
    <div className={`live-amount live-${theme} ${flash ? 'flash' : ''}`}>
      <span className="live-currency">¥</span>
      <span className="live-number">{displayValue}</span>
      <div className="live-gains">
        {gains.map(g => (
          <span key={g.id} className="live-gain-bubble" style={{ '--offset': `${g.offset}px` }}>
            +{g.amount.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}

function RateBadge({ ratePerSec, theme }) {
  return (
    <div className={`rate-badge rate-${theme}`}>
      <TrendingUp size={11} />
      <span className="rate-num">¥{ratePerSec.toFixed(4)}</span>
      <span className="rate-unit">/秒</span>
    </div>
  );
}

function PowerCard({ amount, items, theme }) {
  const item = findPurchasingItem(amount, items);
  if (!item) return null;
  if (item.notYet) {
    return (
      <div className={`power-card power-${theme} power-not-yet`}>
        <div className="power-not-yet-row">
          <span className="power-emoji-faded">{item.emoji}</span>
          <span>距离 {item.name} 还差 ¥{(item.price - amount).toFixed(2)}</span>
        </div>
        <div className="power-mini-bar">
          <div className="power-mini-fill" style={{ width: `${item.progress * 100}%` }}></div>
        </div>
      </div>
    );
  }
  return (
    <div className={`power-card power-${theme}`}>
      <span className="power-emoji">{item.emoji}</span>
      <span>已经够 <strong>{item.name}</strong> 啦</span>
    </div>
  );
}

// ====== 苦命主题：可爱小哭包 ======
function MiserableView({ earnings, items }) {
  const { regular, phase, progress, remainingMs, ratePerSec } = earnings;
  
  const emojiWall = useMemo(() => {
    const faces = ['🥺', '🥹', '😩', '😪', '🫠', '😴', '🥲', '😮‍💨', '🌸', '🍑', '✿', '❀'];
    return Array.from({ length: 38 }, (_, i) => ({
      id: i,
      face: faces[Math.floor(Math.random() * faces.length)],
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 14 + Math.random() * 30,
      rotate: Math.random() * 60 - 30,
      opacity: 0.18 + Math.random() * 0.22,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 4,
    }));
  }, []);
  
  const messages = {
    before: '还没开始上工，再赖一会儿被窝吧～',
    working: '又出来卖命换钱钱了 🥺',
    after: '今天的命已售罄，请签收',
  };
  
  return (
    <div className="miserable-view">
      <span className="corner-deco corner-tl">✿</span>
      <span className="corner-deco corner-tr">❀</span>
      <span className="corner-deco corner-bl">❀</span>
      <span className="corner-deco corner-br">✿</span>
      <div className="m-emoji-wall">
        {emojiWall.map(e => (
          <span key={e.id} className="m-emoji"
            style={{
              top: `${e.top}%`, left: `${e.left}%`,
              fontSize: `${e.size}px`,
              transform: `rotate(${e.rotate}deg)`,
              opacity: e.opacity,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
            }}>{e.face}</span>
        ))}
      </div>
      <div className="m-content">
        <div className="m-header">
          <div className="m-stamp">📖 打工小日记 · 第 {new Date().getDate()} 页</div>
          <span className="m-mascot">🥺</span>
        </div>
        <div className="m-status">{messages[phase]}</div>
        <LiveAmount value={regular} theme="miserable" />
        <RateBadge ratePerSec={ratePerSec} theme="miserable" />
        <PowerCard amount={regular} items={items} theme="miserable" />
        <div className="m-progress-wrap">
          <div className="m-progress-label">
            <span>🌸 今日打工进度</span>
            <span>{(progress * 100).toFixed(2)}%</span>
          </div>
          <div className="m-progress-bar">
            <div className="m-progress-fill" style={{ width: `${progress * 100}%` }}></div>
          </div>
        </div>
        {phase === 'working' && (
          <div className="m-remaining">⏳ 距离自由还有 {formatDuration(remainingMs)}</div>
        )}
        <div className="m-footer">·˚ ༘ ⋆｡˚ 一个软软的小打工人 ˚｡⋆ ༘ ˚·</div>
      </div>
    </div>
  );
}

function EnergeticView({ earnings, items }) {
  const { regular, phase, progress, remainingMs, overtimeMs, ratePerSec } = earnings;
  const messages = {
    before: '元气满满 · 蓄势待发！',
    working: '冲冲冲～小钱钱往口袋里跑！',
    after: '完美收工 · 满载而归🌟',
  };
  return (
    <div className="energetic-view">
      <span className="corner-deco corner-tl">⭐</span>
      <span className="corner-deco corner-tr">✨</span>
      <span className="corner-deco corner-bl">🌟</span>
      <span className="corner-deco corner-br">⭐</span>
      <div className="e-stripes"></div>
      <div className="e-glow"></div>
      <div className="e-confetti">
        <span style={{ left: '10%', top: '15%' }}>🍊</span>
        <span style={{ left: '85%', top: '25%' }}>🌻</span>
        <span style={{ left: '20%', top: '85%' }}>🥕</span>
        <span style={{ left: '78%', top: '78%' }}>🌼</span>
      </div>
      <div className="e-header">
        <div className="e-tag"><Flame size={14} /> 今日开赚</div>
        <div className="e-date">{new Date().toLocaleDateString('zh-CN')}</div>
      </div>
      <div className="e-status">{messages[phase]}</div>
      <LiveAmount value={regular} theme="energetic" />
      <RateBadge ratePerSec={ratePerSec} theme="energetic" />
      <PowerCard amount={regular} items={items} theme="energetic" />
      <div className="e-stats">
        <div className="e-stat">
          <div className="e-stat-label">🌟 完成度</div>
          <div className="e-stat-value">{(progress * 100).toFixed(1)}<span className="e-stat-unit">%</span></div>
        </div>
        <div className="e-stat-divider"></div>
        <div className="e-stat">
          <div className="e-stat-label">{phase === 'after' ? '🍊 加班' : '🌻 剩余'}</div>
          <div className="e-stat-value e-stat-value-sm">
            {phase === 'after' ? formatDuration(overtimeMs) : formatDuration(remainingMs)}
          </div>
        </div>
      </div>
      <div className="e-progress">
        <div className="e-progress-fill" style={{ width: `${progress * 100}%` }}></div>
      </div>
      <div className="e-footer"><Zap size={12} /> 冲鸭！钱包君正在长大～</div>
    </div>
  );
}

function ChillView({ earnings, items }) {
  const { regular, phase, progress, remainingMs, ratePerSec } = earnings;
  const messages = {
    before: '还早呢，再赖一会儿被窝吧～',
    working: '佛系摸鱼中，钱钱自己会长大',
    after: '下班咯！今天又活下来啦 🌷',
  };
  return (
    <div className="chill-view">
      <span className="corner-deco corner-tl">🌸</span>
      <span className="corner-deco corner-tr">🍑</span>
      <span className="corner-deco corner-bl">🦄</span>
      <span className="corner-deco corner-br">🌷</span>
      <div className="c-clouds"></div>
      <div className="c-floating-emoji" style={{ '--delay': '0s' }}>☁️</div>
      <div className="c-floating-emoji" style={{ '--delay': '1.5s', left: '70%' }}>🎀</div>
      <div className="c-floating-emoji" style={{ '--delay': '3s', left: '40%', top: '60px' }}>✨</div>
      <div className="c-floating-emoji" style={{ '--delay': '4.5s', left: '15%', top: '120px' }}>🌷</div>
      <div className="c-floating-emoji" style={{ '--delay': '2s', left: '85%', top: '150px' }}>🍑</div>
      <div className="c-header">
        <span className="c-mood">🦥</span>
        <span className="c-mood-text">今日心情：佛系小公主</span>
      </div>
      <div className="c-status">{messages[phase]}</div>
      <LiveAmount value={regular} theme="chill" />
      <RateBadge ratePerSec={ratePerSec} theme="chill" />
      <PowerCard amount={regular} items={items} theme="chill" />
      <div className="c-progress-wrap">
        <div className="c-progress-track">
          <div className="c-progress-fill" style={{ width: `${progress * 100}%` }}>
            <span className="c-progress-dot">🐌</span>
          </div>
        </div>
        <div className="c-progress-text">💗 慢慢来，已经走了 {(progress * 100).toFixed(1)}% 啦</div>
      </div>
      {phase === 'working' && (
        <div className="c-remaining">
          <Cloud size={12} /> 还有 {formatDuration(remainingMs)} 就自由咯～
        </div>
      )}
      <div className="c-footer">·｡♡ 活着就行 · 啥都别想 ♡｡·</div>
    </div>
  );
}

// ====== 摸鱼计时器 ======
function MoyuTimer({ moyuState, setMoyuState, ratePerSec, theme }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!moyuState.startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [moyuState.startedAt]);
  useEffect(() => {
    if (moyuState.date !== todayStr()) {
      setMoyuState({ date: todayStr(), totalMs: 0, totalEarned: 0, startedAt: null });
    }
  }, []);
  const isMoyuing = !!moyuState.startedAt;
  const currentSessionMs = isMoyuing ? now - moyuState.startedAt : 0;
  const currentSessionEarned = isMoyuing ? (currentSessionMs / 1000) * ratePerSec : 0;
  const totalMs = moyuState.totalMs + currentSessionMs;
  const totalEarned = moyuState.totalEarned + currentSessionEarned;
  const toggle = () => {
    if (isMoyuing) {
      setMoyuState({
        date: todayStr(),
        totalMs: moyuState.totalMs + currentSessionMs,
        totalEarned: moyuState.totalEarned + currentSessionEarned,
        startedAt: null,
      });
    } else {
      setMoyuState({ ...moyuState, date: todayStr(), startedAt: Date.now() });
    }
  };
  return (
    <div className={`moyu-card moyu-${theme} ${isMoyuing ? 'moyu-active' : ''}`}>
      <div className="moyu-header">
        <Fish size={14} /><span>摸鱼计时器</span>
        {isMoyuing && <span className="moyu-live-dot"></span>}
      </div>
      {isMoyuing && (
        <div className="moyu-session">
          <div className="moyu-session-label">本次摸鱼中</div>
          <div className="moyu-session-time">{formatDuration(currentSessionMs)}</div>
          <div className="moyu-session-earned">薅到 ¥{currentSessionEarned.toFixed(2)}</div>
        </div>
      )}
      <button className="moyu-btn" onClick={toggle}>
        {isMoyuing ? <><Square size={14} /> 停止摸鱼</> : <><Play size={14} /> 开始摸鱼</>}
      </button>
      <div className="moyu-totals">
        <div className="moyu-total-row">
          <span className="moyu-total-label">今日摸鱼</span>
          <span className="moyu-total-value">{formatDuration(totalMs)}</span>
        </div>
        <div className="moyu-total-row">
          <span className="moyu-total-label">偷到工资</span>
          <span className="moyu-total-value moyu-total-money">¥{totalEarned.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function PaidOvertime({ earnings, overtimeRate, theme }) {
  if (earnings.phase !== 'after') {
    return (
      <div className={`ot-paid ot-${theme} ot-paid-waiting`}>
        <div className="ot-paid-title">加班奖励通道</div>
        <div className="ot-paid-sub">下班后自动开启 · {overtimeRate}x 时薪</div>
      </div>
    );
  }
  return (
    <div className={`ot-paid ot-${theme}`}>
      <div className="ot-paid-header"><Sparkles size={14} /><span>加班费 · {overtimeRate}x</span></div>
      <div className="ot-paid-amount">
        <span className="ot-paid-currency">+¥</span>
        <span className="ot-paid-number">{earnings.overtime.toFixed(2)}</span>
      </div>
      <div className="ot-paid-time">已加班 {formatDuration(earnings.overtimeMs)}</div>
      <div className="ot-paid-total">今日总计 ¥{(earnings.regular + earnings.overtime).toFixed(2)}</div>
    </div>
  );
}

function UnpaidOvertime({ energy, setEnergy, earnings, theme }) {
  const [message, setMessage] = useState(careMessages[0]);
  useEffect(() => {
    setMessage(careMessages[Math.floor(Math.random() * careMessages.length)]);
  }, [Math.floor(energy / 10)]);
  const isOvertiming = earnings.phase === 'after';
  return (
    <div className={`ot-care ot-${theme}`}>
      <div className="ot-care-header"><Heart size={14} fill="currentColor" /><span>能量监测站</span></div>
      {!isOvertiming ? (
        <div className="ot-care-empty">
          <MascotInline mood="comfort" theme={theme}
            message="还在工作时间"
            sub="如需加班，回来打卡能量" />
        </div>
      ) : (
        <>
          <div className="ot-care-energy-label">这次加班消耗了多少能量？</div>
          <div className="ot-care-slider-wrap">
            <input type="range" min="0" max="100" value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="ot-care-slider" />
            <div className="ot-care-slider-value">
              <span className="ot-care-slider-num">{energy}</span>
              <span className="ot-care-slider-unit">%</span>
            </div>
          </div>
          <div className="ot-care-bar">
            <div className="ot-care-bar-fill" style={{
              width: `${energy}%`,
              background: energy < 30 ? '#86efac' : energy < 60 ? '#fde047' : energy < 85 ? '#fb923c' : '#f87171'
            }}></div>
          </div>
          <div className="ot-care-message"><Coffee size={14} /><span>{message}</span></div>
          {energy >= 70 && (
            <div className="ot-care-alert">⚠️ 能量严重透支，请立刻为自己点点吃的喝的</div>
          )}
        </>
      )}
    </div>
  );
}

// ====== 常驻装饰贴纸：4 只小狗永远在屏幕边角 ======
function DecoStickers({ theme }) {
  // 固定挑 4 只不同情绪的，让人印象深刻
  const stickers = useMemo(() => {
    const moods = ['cheer', 'comfort', 'wisdom', 'win'];
    return moods.map(m => pickMascot(m));
  }, []);
  // 每只贴纸：屏幕固定位置 + 旋转角度 + 大小
  const slots = [
    { className: 'deco-tl', rot: -8, size: 130 },
    { className: 'deco-tr', rot: 10, size: 120 },
    { className: 'deco-bl', rot: 12, size: 140 },
    { className: 'deco-br-stack', rot: -6, size: 130 },
  ];
  return (
    <div className={`deco-stickers deco-${theme}`} aria-hidden="true">
      {stickers.map((s, i) => (
        <img key={s.id} src={s.src} alt=""
          className={`deco-sticker ${slots[i].className}`}
          style={{
            '--rot': `${slots[i].rot}deg`,
            width: `${slots[i].size}px`,
            height: `${slots[i].size}px`,
          }} />
      ))}
    </div>
  );
}

// ====== 小狗使者：浮动按钮 ======
function MascotButton({ theme, onClick, hasNew }) {
  const [peek, setPeek] = useState(() => pickMascot());
  // 每隔一段时间换一张缩略图，让按钮看起来活的
  useEffect(() => {
    const t = setInterval(() => setPeek(pickMascot()), 18000);
    return () => clearInterval(t);
  }, []);
  return (
    <button className={`mascot-btn mascot-btn-${theme} ${hasNew ? 'mascot-btn-new' : ''}`}
      onClick={onClick} aria-label="召唤一只正能量小狗">
      <img src={peek.src} alt="" className="mascot-btn-img" />
      <span className="mascot-btn-bone">
        <Dog size={14} />
      </span>
      {hasNew && <span className="mascot-btn-dot"></span>}
    </button>
  );
}

// ====== 小狗使者：弹出卡片 ======
function MascotCard({ theme, mood, onClose }) {
  const [mascot, setMascot] = useState(() => pickMascot(mood));
  const reroll = () => {
    let next = pickMascot(mood);
    // 尽量不连续给同一张
    if (MASCOTS.length > 1) {
      let safety = 0;
      while (next.id === mascot.id && safety < 5) { next = pickMascot(mood); safety++; }
    }
    setMascot(next);
  };
  // 随机轻微倾斜：拍立得风格
  const tilt = useMemo(() => (Math.random() * 6 - 3).toFixed(2), [mascot.id]);
  return (
    <div className={`mascot-overlay mascot-overlay-${theme}`} onClick={onClose}>
      <div className="mascot-card" onClick={(e) => e.stopPropagation()}
        style={{ '--tilt': `${tilt}deg` }}>
        <button className="mascot-close" onClick={onClose} aria-label="关闭"><X size={16} /></button>
        <div className="mascot-tape mascot-tape-l"></div>
        <div className="mascot-tape mascot-tape-r"></div>
        <div className="mascot-img-wrap">
          <img src={mascot.src} alt={mascot.title} className="mascot-img" />
          <div className="mascot-stars">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="mascot-star" style={{
                '--mx': `${(Math.random() - 0.5) * 200}px`,
                '--my': `${(Math.random() - 0.5) * 240}px`,
                '--md': `${Math.random() * 0.6}s`,
              }}>✨</span>
            ))}
          </div>
        </div>
        <div className="mascot-text">
          <div className="mascot-title">{mascot.title}</div>
          <div className="mascot-quote">「{mascot.quote}」</div>
        </div>
        <div className="mascot-actions">
          <button className="mascot-reroll" onClick={reroll}>
            <RefreshCw size={14} /> 再来一只
          </button>
          <button className="mascot-ok" onClick={onClose}>
            收下了，谢谢小狗 🐾
          </button>
        </div>
        <div className="mascot-meta">— 小狗使者 vol.{Math.floor(Math.random() * 999) + 1} —</div>
      </div>
    </div>
  );
}

// ====== 随机贴纸：屏幕边缘飘过来 ======
function MascotToast({ mascot, theme, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7500);
    return () => clearTimeout(t);
  }, [onClose]);
  const fromLeft = useMemo(() => Math.random() > 0.5, []);
  return (
    <div className={`mascot-toast mascot-toast-${theme} ${fromLeft ? 'from-l' : 'from-r'}`}
      onClick={onClose}>
      <img src={mascot.src} alt="" className="mascot-toast-img" />
      <div className="mascot-toast-bubble">
        <div className="mascot-toast-title">{mascot.title}</div>
        <div className="mascot-toast-quote">{mascot.quote}</div>
      </div>
    </div>
  );
}

// ====== 加班自救空状态：用小狗替代单调 emoji ======
function MascotInline({ mood, message, sub, theme }) {
  const mascot = useMemo(() => pickMascot(mood), [mood]);
  return (
    <div className={`mascot-inline mascot-inline-${theme}`}>
      <img src={mascot.src} alt="" className="mascot-inline-img" />
      <div className="mascot-inline-text">
        <div className="mascot-inline-title">{message}</div>
        {sub && <div className="mascot-inline-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ====== 里程碑庆祝 ======
function MilestoneCelebration({ milestone, theme, onClose }) {
  const mascot = useMemo(() => pickMascot('cheer'), [milestone.id]);
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`celebration celebration-${theme}`} onClick={onClose}>
      <div className="celebration-inner">
        <img src={mascot.src} alt="" className="celebration-mascot" />
        <div className="celebration-emoji">{milestone.emoji}</div>
        <div className="celebration-amount">¥{milestone.amount}</div>
        <div className="celebration-message">{milestone.message}</div>
        {theme === 'energetic' && (
          <div className="celebration-effect">
            {Array.from({length: 30}, (_, i) => (
              <span key={i} className="confetti-piece" style={{
                '--x': `${(Math.random() - 0.5) * 600}px`,
                '--y': `${Math.random() * 400 + 100}px`,
                '--rot': `${Math.random() * 720}deg`,
                '--delay': `${Math.random() * 0.3}s`,
                background: ['#ffeb3b', '#ff6b00', '#ff2200', '#fff'][Math.floor(Math.random()*4)],
              }}></span>
            ))}
          </div>
        )}
        {theme === 'chill' && (
          <div className="celebration-effect">
            {Array.from({length: 14}, (_, i) => (
              <span key={i} className="sparkle" style={{
                '--x': `${(Math.random() - 0.5) * 400}px`,
                '--y': `${(Math.random() - 0.5) * 300}px`,
                '--delay': `${Math.random() * 0.5}s`,
              }}>✨</span>
            ))}
          </div>
        )}
        {theme === 'miserable' && (
          <div className="celebration-effect">
            {Array.from({length: 8}, (_, i) => (
              <span key={i} className="tear" style={{
                '--x': `${(Math.random() - 0.5) * 400}px`,
                '--delay': `${Math.random() * 0.4}s`,
              }}>💧</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====== 设置面板 ======
function SettingsPanel({ settings, setSettings, items, setItems, milestones, setMilestones, onClose }) {
  const [tab, setTab] = useState('basic');
  const [draft, setDraft] = useState(settings);
  const saveBasic = () => { setSettings(draft); onClose(); };
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span>⚙️ 配置面板</span>
          <button onClick={onClose} className="settings-close"><X size={18} /></button>
        </div>
        <div className="settings-tabs">
          <button className={`s-tab ${tab === 'basic' ? 'active' : ''}`} onClick={() => setTab('basic')}>基础</button>
          <button className={`s-tab ${tab === 'power' ? 'active' : ''}`} onClick={() => setTab('power')}>购买力</button>
          <button className={`s-tab ${tab === 'goal' ? 'active' : ''}`} onClick={() => setTab('goal')}>里程碑</button>
        </div>
        {tab === 'basic' && (
          <div className="settings-body">
            <div className="settings-row">
              <label>上班时间</label>
              <input type="time" value={draft.startTime} onChange={(e) => setDraft({...draft, startTime: e.target.value})} />
            </div>
            <div className="settings-row">
              <label>下班时间</label>
              <input type="time" value={draft.endTime} onChange={(e) => setDraft({...draft, endTime: e.target.value})} />
            </div>
            <div className="settings-row">
              <label>日薪 (¥)</label>
              <input type="number" value={draft.dailySalary} onChange={(e) => setDraft({...draft, dailySalary: Number(e.target.value)})} />
            </div>
            <div className="settings-row">
              <label>加班费倍率</label>
              <input type="number" step="0.1" value={draft.overtimeRate} onChange={(e) => setDraft({...draft, overtimeRate: Number(e.target.value)})} />
            </div>
            <button className="settings-save" onClick={saveBasic}>保存设置</button>
          </div>
        )}
        {tab === 'power' && (
          <ItemEditor items={items} setItems={setItems} 
            label="购买力对照" 
            hint="加你想要的东西，例如：一杯奶茶 ¥18"
            nameField="name" priceField="price" 
            placeholder={{ emoji: '🍵', name: '一杯奶茶', price: 18 }} />
        )}
        {tab === 'goal' && (
          <ItemEditor items={milestones} setItems={setMilestones}
            label="今日里程碑"
            hint="赚到金额时弹特效庆祝"
            nameField="message" priceField="amount"
            placeholder={{ emoji: '🎯', message: '我也是有点用的！', amount: 100 }} />
        )}
      </div>
    </div>
  );
}

function ItemEditor({ items, setItems, label, hint, nameField, priceField, placeholder }) {
  const [draft, setDraft] = useState(placeholder);
  const add = () => {
    if (!draft.emoji || !draft[nameField] || !draft[priceField]) return;
    const newItem = { id: `u${Date.now()}`, emoji: draft.emoji, [nameField]: draft[nameField], [priceField]: Number(draft[priceField]) };
    setItems([...items, newItem]);
    setDraft(placeholder);
  };
  const remove = (id) => setItems(items.filter(it => it.id !== id));
  const sorted = [...items].sort((a, b) => a[priceField] - b[priceField]);
  return (
    <div className="settings-body">
      <div className="editor-label">{label}</div>
      <div className="editor-hint">{hint}</div>
      <div className="editor-add">
        <input className="editor-emoji-input" value={draft.emoji}
          onChange={(e) => setDraft({...draft, emoji: e.target.value})}
          placeholder="🎁" maxLength={2} />
        <input className="editor-name-input" value={draft[nameField] || ''}
          onChange={(e) => setDraft({...draft, [nameField]: e.target.value})}
          placeholder={nameField === 'name' ? '名称' : '庆祝文案'} />
        <input className="editor-price-input" type="number" value={draft[priceField] || ''}
          onChange={(e) => setDraft({...draft, [priceField]: e.target.value})}
          placeholder="¥" />
        <button className="editor-add-btn" onClick={add}><Plus size={16} /></button>
      </div>
      <div className="editor-list">
        {sorted.map(item => (
          <div key={item.id} className="editor-item">
            <span className="editor-item-emoji">{item.emoji}</span>
            <span className="editor-item-name">{item[nameField]}</span>
            <span className="editor-item-price">¥{item[priceField]}</span>
            <button className="editor-item-remove" onClick={() => remove(item.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== 主组件 ======
export default function App() {
  const [theme, setTheme] = useState('miserable');
  const [overtimeMode, setOvertimeMode] = useState('paid');
  const [showSettings, setShowSettings] = useState(false);
  const [showMoyu, setShowMoyu] = useState(true);
  const [energy, setEnergy] = useState(50);
  const [settings, setSettings] = useState({
    startTime: '10:00', endTime: '18:00', dailySalary: 500, overtimeRate: 1.5,
  });
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [moyuState, setMoyuState] = useState({ date: todayStr(), totalMs: 0, totalEarned: 0, startedAt: null });
  const [hitMilestones, setHitMilestones] = useState({ date: todayStr(), ids: [] });
  const [activeCelebration, setActiveCelebration] = useState(null);
  const [mascotOpen, setMascotOpen] = useState(false);
  const [mascotHasNew, setMascotHasNew] = useState(false);
  const [mascotToast, setMascotToast] = useState(null);
  const lastToastRef = useRef(0);
  
  useEffect(() => {
    (async () => {
      const safeGet = async (k) => { try { const r = await window.storage?.get(k); return r?.value; } catch { return null; } };
      const s = await safeGet('salary_v2_settings'); if (s) setSettings(JSON.parse(s));
      const t = await safeGet('salary_v2_theme'); if (t) setTheme(t);
      const o = await safeGet('salary_v2_ot'); if (o) setOvertimeMode(o);
      const i = await safeGet('salary_v2_items'); if (i) setItems(JSON.parse(i));
      const m = await safeGet('salary_v2_milestones'); if (m) setMilestones(JSON.parse(m));
      const my = await safeGet('salary_v2_moyu'); 
      if (my) { const p = JSON.parse(my); if (p.date === todayStr()) setMoyuState(p); }
      const h = await safeGet('salary_v2_hit');
      if (h) { const p = JSON.parse(h); if (p.date === todayStr()) setHitMilestones(p); }
    })();
  }, []);
  
  const save = (k, v) => { window.storage?.set(k, typeof v === 'string' ? v : JSON.stringify(v)).catch(() => {}); };
  useEffect(() => save('salary_v2_settings', settings), [settings]);
  useEffect(() => save('salary_v2_theme', theme), [theme]);
  useEffect(() => save('salary_v2_ot', overtimeMode), [overtimeMode]);
  useEffect(() => save('salary_v2_items', items), [items]);
  useEffect(() => save('salary_v2_milestones', milestones), [milestones]);
  useEffect(() => save('salary_v2_moyu', moyuState), [moyuState]);
  useEffect(() => save('salary_v2_hit', hitMilestones), [hitMilestones]);
  
  const now = useNow(50);
  const earnings = calcEarnings(now, settings);
  
  useEffect(() => {
    if (hitMilestones.date !== todayStr()) {
      setHitMilestones({ date: todayStr(), ids: [] });
      return;
    }
    for (const m of milestones) {
      if (earnings.regular >= m.amount && !hitMilestones.ids.includes(m.id)) {
        setHitMilestones({ date: todayStr(), ids: [...hitMilestones.ids, m.id] });
        setActiveCelebration(m);
        break;
      }
    }
  }, [earnings.regular, milestones, hitMilestones]);

  // 选当前情境的小狗心情
  const moodForContext = useCallback(() => {
    if (earnings.phase === 'after' && overtimeMode === 'unpaid') return 'comfort';
    if (earnings.phase === 'after' && overtimeMode === 'paid') return 'cheer';
    if (moyuState.startedAt) return 'wisdom';
    if (earnings.phase === 'before') return 'comfort';
    return Math.random() > 0.5 ? 'cheer' : 'wisdom';
  }, [earnings.phase, overtimeMode, moyuState.startedAt]);

  // 每隔 4~7 分钟 弹一只小狗安慰一下；mascot 卡片打开时不打扰
  useEffect(() => {
    let stopped = false;
    let timer;
    const schedule = (delayMs) => {
      timer = setTimeout(() => {
        if (stopped) return;
        if (!mascotOpen && !activeCelebration) {
          const m = pickMascot(moodForContext());
          setMascotToast(m);
          setMascotHasNew(true);
        }
        const next = (4 + Math.random() * 3) * 60 * 1000;
        schedule(next);
      }, delayMs);
    };
    schedule(90 * 1000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [mascotOpen, activeCelebration, moodForContext]);
  
  return (
    <>
      <style>{`@import url('${FONTS_LINK}');`}</style>
      <style>{styles}</style>
      <div className={`app theme-${theme}`}>
        <DecoStickers theme={theme} />
        <div className="top-bar">
          <div className="theme-tabs">
            <button className={`theme-tab ${theme === 'miserable' ? 'active' : ''}`} onClick={() => setTheme('miserable')}>😩 苦命</button>
            <button className={`theme-tab ${theme === 'energetic' ? 'active' : ''}`} onClick={() => setTheme('energetic')}>🔥 干劲</button>
            <button className={`theme-tab ${theme === 'chill' ? 'active' : ''}`} onClick={() => setTheme('chill')}>🦥 摆烂</button>
          </div>
          <div className="top-actions">
            <button className={`moyu-toggle ${showMoyu ? 'active' : ''} ${moyuState.startedAt ? 'moyu-on' : ''}`}
              onClick={() => setShowMoyu(!showMoyu)}>
              <Fish size={14} />{moyuState.startedAt ? '摸鱼中' : '摸鱼'}
            </button>
            <button className="settings-btn" onClick={() => setShowSettings(true)}>
              <Settings size={16} />
            </button>
          </div>
        </div>
        <div className="main-area">
          <div className="main-column">
            {theme === 'miserable' && <MiserableView earnings={earnings} items={items} />}
            {theme === 'energetic' && <EnergeticView earnings={earnings} items={items} />}
            {theme === 'chill' && <ChillView earnings={earnings} items={items} />}
          </div>
        </div>
        {(showMoyu || overtimeMode !== 'none') && (
          <div className="helpers-row">
            {showMoyu && (
              <MoyuTimer moyuState={moyuState} setMoyuState={setMoyuState}
                ratePerSec={earnings.ratePerSec} theme={theme} />
            )}
            {overtimeMode === 'paid' && (
              <PaidOvertime earnings={earnings} overtimeRate={settings.overtimeRate} theme={theme} />
            )}
            {overtimeMode === 'unpaid' && (
              <UnpaidOvertime energy={energy} setEnergy={setEnergy} earnings={earnings} theme={theme} />
            )}
          </div>
        )}
        <div className="ot-switcher">
          <span className="ot-switcher-label">加班模式：</span>
          <button className={`ot-btn ${overtimeMode === 'none' ? 'active' : ''}`} onClick={() => setOvertimeMode('none')}>不加班</button>
          <button className={`ot-btn ${overtimeMode === 'paid' ? 'active' : ''}`} onClick={() => setOvertimeMode('paid')}>💰 加班赚钱</button>
          <button className={`ot-btn ${overtimeMode === 'unpaid' ? 'active' : ''}`} onClick={() => setOvertimeMode('unpaid')}>💗 加班自救</button>
        </div>
        {showSettings && (
          <SettingsPanel settings={settings} setSettings={setSettings}
            items={items} setItems={setItems}
            milestones={milestones} setMilestones={setMilestones}
            onClose={() => setShowSettings(false)} />
        )}
        {activeCelebration && (
          <MilestoneCelebration milestone={activeCelebration} theme={theme}
            onClose={() => setActiveCelebration(null)} />
        )}
        {mascotToast && !mascotOpen && (
          <MascotToast mascot={mascotToast} theme={theme}
            onClose={() => setMascotToast(null)} />
        )}
        <MascotButton theme={theme} hasNew={mascotHasNew}
          onClick={() => {
            setMascotOpen(true);
            setMascotHasNew(false);
            setMascotToast(null);
          }} />
        {mascotOpen && (
          <MascotCard theme={theme} mood={moodForContext()}
            onClose={() => setMascotOpen(false)} />
        )}
      </div>
    </>
  );
}

const styles = `
  .app { min-height: 100vh; padding: 20px 16px; display: flex; flex-direction: column; align-items: center; gap: 14px; font-family: 'Noto Sans SC', sans-serif; transition: background 0.8s ease; position: relative; }
  /* 苦命：奶咖&樱桃饼干 */
  .theme-miserable { background: linear-gradient(135deg, #fff5e6 0%, #ffe6d6 45%, #ffd5cc 100%); color: #8b5a3c; }
  /* 干劲：阳光橙桃 */
  .theme-energetic { background: linear-gradient(135deg, #fff3a8 0%, #ffd89c 50%, #ff9b7a 100%); color: #6d4530; }
  /* 摆烂：奶油草莓樱花 */
  .theme-chill { background: linear-gradient(135deg, #fff5fa 0%, #ffe4ec 40%, #ffd6e8 70%, #f7d6f0 100%); color: #8c5a72; }

  /* 全局背景小花朵图案（轻得几乎看不见，只是为了不空） */
  .app::before {
    content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      radial-gradient(circle at 12% 18%, rgba(255,255,255,0.45) 0%, transparent 8%),
      radial-gradient(circle at 88% 28%, rgba(255,255,255,0.35) 0%, transparent 9%),
      radial-gradient(circle at 22% 78%, rgba(255,255,255,0.35) 0%, transparent 8%),
      radial-gradient(circle at 78% 88%, rgba(255,255,255,0.45) 0%, transparent 9%);
  }
  .app > * { position: relative; z-index: 1; }
  
  .top-bar { width: 100%; max-width: 920px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
  .theme-tabs { display: flex; gap: 6px; padding: 4px; background: rgba(255,255,255,0.55); border-radius: 999px; backdrop-filter: blur(6px); border: 1.5px dashed rgba(255,255,255,0.9); box-shadow: 0 4px 14px rgba(160, 100, 80, 0.08); }
  .top-actions { display: flex; gap: 8px; }
  .theme-tab, .moyu-toggle { padding: 8px 14px; border: 1.5px solid transparent; background: transparent; color: inherit; border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 13px; opacity: 0.7; transition: all 0.25s; display: inline-flex; align-items: center; gap: 5px; }
  .theme-tab:hover, .moyu-toggle:hover { opacity: 1; transform: translateY(-1px); }
  .theme-tab.active { opacity: 1; }
  .theme-miserable .theme-tab.active { background: #ffd6c2; color: #8b3e2a; box-shadow: 0 3px 10px rgba(220, 130, 100, 0.3); }
  .theme-energetic .theme-tab.active { background: #fff5b8; color: #b8431a; box-shadow: 0 3px 10px rgba(255, 180, 80, 0.4); }
  .theme-chill .theme-tab.active { background: #fbcfe8; color: #c2185b; box-shadow: 0 3px 10px rgba(244, 168, 212, 0.5); }
  .moyu-toggle { background: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.9); }
  .moyu-toggle.active { opacity: 1; }
  .moyu-toggle.moyu-on { opacity: 1; background: #5fbf8c; color: white; border-color: #5fbf8c; animation: moyu-pulse 1.5s infinite; }
  @keyframes moyu-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(95, 191, 140, 0.5); } 50% { box-shadow: 0 0 0 8px rgba(95, 191, 140, 0); } }
  .settings-btn { background: rgba(255,255,255,0.6); border: 1.5px solid rgba(255,255,255,0.9); color: inherit; padding: 8px; border-radius: 50%; cursor: pointer; opacity: 0.85; display: flex; align-items: center; backdrop-filter: blur(4px); }
  .settings-btn:hover { opacity: 1; transform: rotate(45deg); transition: transform 0.3s; box-shadow: 0 3px 10px rgba(160, 100, 80, 0.15); }

  /* === 屏幕常驻装饰贴纸：4 只小狗永远在四角 === */
  .deco-stickers { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .deco-sticker {
    position: fixed; border-radius: 50%;
    border: 5px solid #fff;
    box-shadow: 0 10px 28px rgba(160, 100, 80, 0.28);
    transform: rotate(var(--rot, 0deg));
    transition: transform 0.5s ease, opacity 0.5s ease;
    opacity: 0.85;
    object-fit: cover;
    animation: deco-bob 6s ease-in-out infinite;
  }
  .deco-sticker:nth-child(2) { animation-delay: 1.5s; }
  .deco-sticker:nth-child(3) { animation-delay: 3s; }
  .deco-sticker:nth-child(4) { animation-delay: 4.5s; }
  @keyframes deco-bob {
    0%, 100% { transform: rotate(var(--rot, 0deg)) translateY(0); }
    50% { transform: rotate(calc(var(--rot, 0deg) + 4deg)) translateY(-6px); }
  }
  .deco-tl { top: 14px; left: 14px; }
  .deco-tr { top: 14px; right: 130px; } /* 给设置按钮让位 */
  .deco-bl { bottom: 14px; left: 14px; }
  .deco-br-stack { bottom: 130px; right: 14px; } /* 给浮动小狗按钮让位 */
  /* 主题适配边框色 */
  .deco-miserable .deco-sticker { border-color: #ffd6c2; }
  .deco-energetic .deco-sticker { border-color: #fff5b8; }
  .deco-chill .deco-sticker { border-color: #fff5fa; }
  /* 移动端：太小屏幕只留 2 张小一点的，避免挡内容 */
  @media (max-width: 760px) {
    .deco-sticker { display: none; }
    .deco-bl, .deco-tr {
      display: block; width: 70px !important; height: 70px !important;
      border-width: 3px;
    }
    .deco-bl { bottom: auto; top: 8px; left: 8px; }
    .deco-tr { top: 8px; right: 100px; }
  }

  /* === 角落花边装饰：所有视图复用 === */
  .corner-deco {
    position: absolute; font-size: 26px; opacity: 0.55;
    pointer-events: none; user-select: none; z-index: 3;
    animation: corner-spin 8s linear infinite;
  }
  .corner-tl { top: 8px; left: 10px; }
  .corner-tr { top: 8px; right: 10px; animation-direction: reverse; }
  .corner-bl { bottom: 8px; left: 10px; animation-direction: reverse; }
  .corner-br { bottom: 8px; right: 10px; }
  @keyframes corner-spin {
    0%, 100% { transform: rotate(0) scale(1); }
    50% { transform: rotate(20deg) scale(1.15); }
  }
  
  .main-area { width: 100%; max-width: 920px; display: grid; grid-template-columns: 1fr; gap: 14px; }
  /* 摸鱼 + 加班 并排成一行；只有一个时它会占满整行 */
  .helpers-row {
    width: 100%; max-width: 920px;
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px; align-items: stretch;
  }
  .helpers-row > * { align-self: stretch; }
  .helpers-row:has(> *:only-child) { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; }
  @media (max-width: 760px) {
    .helpers-row { grid-template-columns: 1fr; }
  }
  
  /* === 实时金额 === */
  .live-amount { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; position: relative; }
  .live-amount.flash .live-number { animation: flash-tick 0.3s ease-out; }
  @keyframes flash-tick {
    0% { filter: brightness(1); transform: translateY(0); }
    30% { filter: brightness(1.5) saturate(1.3); transform: translateY(-2px); }
    100% { filter: brightness(1); transform: translateY(0); }
  }
  .live-currency { font-size: 32px; font-weight: 900; font-family: 'Archivo Black', sans-serif; }
  .live-number { font-size: 68px; font-weight: 900; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; font-family: 'Archivo Black', sans-serif; transition: filter 0.15s; }
  
  .live-miserable .live-currency { color: #d96755; font-family: 'ZCOOL QingKe HuangYou', cursive; }
  .live-miserable .live-number { color: #b8451f; font-family: 'ZCOOL QingKe HuangYou', cursive; text-shadow: 0 4px 0 #ffd6c2, 0 6px 18px rgba(216, 90, 50, 0.25); }
  .live-energetic .live-currency { color: #d4502a; font-family: 'ZCOOL QingKe HuangYou', cursive; }
  .live-energetic .live-number { color: #d4502a; text-shadow: 3px 3px 0 #fff5b8, 6px 6px 0 rgba(180, 80, 30, 0.2); font-family: 'ZCOOL QingKe HuangYou', cursive; }
  .live-chill .live-currency { color: #db6ba2; font-family: 'ZCOOL QingKe HuangYou', cursive; }
  .live-chill .live-number { color: #c2185b; font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 64px; text-shadow: 0 3px 0 #fff5fa, 0 5px 16px rgba(219, 107, 162, 0.3); }
  
  .live-gains { position: absolute; top: -10px; right: 0; pointer-events: none; width: 100%; height: 0; }
  .live-gain-bubble { position: absolute; right: 0; top: 0; font-size: 18px; font-weight: 900; font-family: 'JetBrains Mono', monospace; animation: gain-fly 1.4s ease-out forwards; white-space: nowrap; transform: translateX(var(--offset, 0)); }
  .live-miserable + .live-gains .live-gain-bubble, .live-miserable .live-gain-bubble { color: #fbbf24; text-shadow: 0 0 8px rgba(251, 191, 36, 0.6); }
  .live-energetic .live-gain-bubble { color: #ffeb3b; text-shadow: 0 0 12px rgba(255, 235, 59, 0.8); }
  .live-chill .live-gain-bubble { color: #ec4899; text-shadow: 0 0 8px rgba(236, 72, 153, 0.4); }
  .live-amount.live-miserable .live-gain-bubble { color: #fbbf24; }
  .live-amount.live-energetic .live-gain-bubble { color: #ffeb3b; }
  .live-amount.live-chill .live-gain-bubble { color: #ec4899; }
  @keyframes gain-fly {
    0% { opacity: 0; transform: translateX(var(--offset, 0)) translateY(10px) scale(0.5); }
    20% { opacity: 1; transform: translateX(var(--offset, 0)) translateY(0) scale(1.2); }
    100% { opacity: 0; transform: translateX(var(--offset, 0)) translateY(-50px) scale(1); }
  }
  
  .rate-badge { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 16px; width: fit-content; position: relative; z-index: 2; }
  .rate-miserable { background: #fff0e3; color: #b8451f; border: 1.5px dashed #ffb893; }
  .rate-energetic { background: #fff5b8; color: #b8431a; border: 1.5px dashed #ffb84a; }
  .rate-chill { background: #fff5fa; color: #c2185b; border: 1.5px dashed #f9a8d4; }
  .rate-num { font-variant-numeric: tabular-nums; }
  .rate-unit { opacity: 0.7; }
  
  .power-card { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; font-size: 13px; margin-bottom: 16px; width: fit-content; max-width: 100%; position: relative; z-index: 2; }
  .power-miserable { background: #ffe6d6; color: #8b3e2a; border: 1.5px solid #ffc4a3; box-shadow: 0 3px 8px rgba(220, 130, 100, 0.15); }
  .power-energetic { background: #fff5b8; color: #b8431a; border: 1.5px solid #ffb84a; font-weight: 700; box-shadow: 0 3px 10px rgba(255, 180, 80, 0.3); }
  .power-chill { background: #fff5fa; color: #c2185b; border: 1.5px solid #f9a8d4; box-shadow: 0 3px 8px rgba(244, 168, 212, 0.2); }
  .power-emoji { font-size: 18px; }
  .power-not-yet { flex-direction: column; align-items: stretch; border-radius: 14px; padding: 10px 16px; }
  .power-not-yet-row { display: flex; align-items: center; gap: 8px; }
  .power-emoji-faded { opacity: 0.5; font-size: 18px; }
  .power-mini-bar { height: 4px; background: rgba(255,255,255,0.6); border-radius: 999px; overflow: hidden; margin-top: 8px; }
  .power-mini-fill { height: 100%; background: currentColor; opacity: 0.7; transition: width 0.5s; border-radius: 999px; }
  
  /* === 苦命主题：可爱小哭包（奶咖+樱花） === */
  .miserable-view {
    position: relative;
    background:
      radial-gradient(circle at 20% 10%, #fff5e6 0%, transparent 35%),
      radial-gradient(circle at 80% 90%, #ffe0d6 0%, transparent 40%),
      #fff8ed;
    border: 2.5px dashed #f0a890;
    padding: 36px 28px;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(220, 130, 100, 0.18), inset 0 0 0 6px rgba(255, 245, 230, 0.6);
    min-height: 480px;
  }
  /* 边角小朵的"邮票打孔"装饰 */
  .miserable-view::before {
    content: ""; position: absolute; inset: 12px;
    border: 1.5px dotted #f0a890; border-radius: 18px;
    pointer-events: none; opacity: 0.5;
  }
  .m-emoji-wall { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
  .m-emoji { position: absolute; user-select: none; animation: m-drift ease-in-out infinite; }
  @keyframes m-drift {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-15px) rotate(8deg); }
  }
  .m-content { position: relative; z-index: 2; }
  .m-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px dashed #ffb893;
    padding-bottom: 12px; margin-bottom: 18px;
  }
  .m-stamp {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 13px; letter-spacing: 0.08em; color: #b8451f;
    background: #ffe6d6; padding: 4px 12px; border-radius: 999px;
    border: 1.5px solid #ffc4a3;
  }
  .m-mascot {
    font-size: 24px; animation: m-mascot-bob 2.5s ease-in-out infinite;
    filter: drop-shadow(0 2px 4px rgba(220,130,100,0.3));
  }
  @keyframes m-mascot-bob {
    0%, 100% { transform: translateY(0) rotate(-3deg); }
    50% { transform: translateY(-4px) rotate(3deg); }
  }
  .m-status {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 15px; color: #d96755; margin-bottom: 14px;
    background: #fff0e3; padding: 6px 14px;
    width: fit-content; border-radius: 999px;
    border: 1.5px dashed #ffb893;
  }
  .m-progress-wrap {
    margin-bottom: 14px; background: #fff5ec;
    padding: 12px 14px; border-radius: 14px;
    border: 1.5px dashed #ffb893;
  }
  .m-progress-label {
    display: flex; justify-content: space-between;
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 13px; color: #8b3e2a;
    margin-bottom: 8px; font-variant-numeric: tabular-nums;
  }
  .m-progress-bar { height: 8px; background: #ffe6d6; border-radius: 999px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(180, 80, 30, 0.15); }
  .m-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ffc4a3 0%, #ff9b7a 50%, #d96755 100%);
    transition: width 0.5s ease; border-radius: 999px;
    box-shadow: 0 0 10px rgba(255, 155, 122, 0.6);
  }
  .m-remaining {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 14px; color: #b8451f;
    text-align: center; padding: 8px 12px;
    background: #fff5b8; border: 1.5px dashed #ffb84a;
    border-radius: 12px; margin-bottom: 10px;
    font-variant-numeric: tabular-nums;
  }
  .m-footer {
    text-align: center; font-family: 'ZCOOL KuaiLe', cursive;
    font-size: 12px; color: #c97a5a; letter-spacing: 0.1em;
    margin-top: 10px;
  }
  
  /* === 干劲主题：阳光橙桃 === */
  .energetic-view {
    position: relative;
    background:
      radial-gradient(circle at 25% 15%, #fff8d6 0%, transparent 45%),
      radial-gradient(circle at 75% 85%, #ffb088 0%, transparent 50%),
      linear-gradient(135deg, #fff5b8 0%, #ffd89c 50%, #ffb88c 100%);
    padding: 36px 28px; border-radius: 24px;
    color: #6d4530; overflow: hidden;
    box-shadow: 0 16px 50px rgba(255, 150, 80, 0.28), inset 0 0 0 4px rgba(255, 245, 230, 0.5);
    border: 2.5px solid #ffd966;
    transform: rotate(-0.3deg);
    min-height: 480px;
  }
  /* 内层奶油波浪边 */
  .energetic-view::before {
    content: ""; position: absolute; inset: 10px;
    border: 2px dashed #ffec8a; border-radius: 18px;
    pointer-events: none; opacity: 0.7;
  }
  .e-stripes {
    position: absolute; inset: 0; pointer-events: none;
    background-image: repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.18) 30px, rgba(255,255,255,0.18) 32px);
  }
  /* 大太阳光晕 */
  .e-glow {
    position: absolute; top: -40%; right: -25%;
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(255,255,200,0.7) 0%, transparent 65%);
    pointer-events: none; animation: pulse 3s infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
  /* 飘浮的小水果/小花朵 */
  .e-confetti { position: absolute; inset: 0; pointer-events: none; }
  .e-confetti span {
    position: absolute; font-size: 22px; opacity: 0.7;
    animation: e-confetti-bob 4s ease-in-out infinite;
    filter: drop-shadow(0 2px 4px rgba(180,80,30,0.2));
  }
  .e-confetti span:nth-child(2) { animation-delay: 1s; }
  .e-confetti span:nth-child(3) { animation-delay: 2s; }
  .e-confetti span:nth-child(4) { animation-delay: 3s; }
  @keyframes e-confetti-bob {
    0%, 100% { transform: translateY(0) rotate(-8deg); }
    50% { transform: translateY(-12px) rotate(8deg); }
  }
  .e-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 2; }
  .e-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff5b8; color: #b8431a;
    padding: 5px 14px; border: 1.5px solid #ffd966;
    font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 13px;
    letter-spacing: 0.05em; border-radius: 999px;
    box-shadow: 0 3px 8px rgba(255, 180, 80, 0.3);
  }
  .e-date {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 14px; color: #8b5a3c;
    background: rgba(255, 245, 230, 0.7); padding: 3px 10px; border-radius: 999px;
  }
  .e-status {
    font-family: 'ZCOOL QingKe HuangYou', 'Noto Sans SC', cursive;
    font-size: 24px; color: #b8431a;
    letter-spacing: 0.03em; margin-bottom: 14px; position: relative; z-index: 2;
    text-shadow: 0 3px 0 #fff5b8, 0 5px 12px rgba(180, 80, 30, 0.2);
  }
  .e-stats {
    display: flex; align-items: center;
    background: #fff8e6; border: 2px dashed #ffb84a;
    padding: 14px 16px; border-radius: 16px;
    margin-bottom: 14px; position: relative; z-index: 2;
    box-shadow: 0 4px 12px rgba(255, 180, 80, 0.2);
  }
  .e-stat { flex: 1; }
  .e-stat-divider { width: 2px; height: 40px; background: repeating-linear-gradient(to bottom, #ffb84a 0, #ffb84a 4px, transparent 4px, transparent 8px); margin: 0 14px; }
  .e-stat-label {
    font-family: 'ZCOOL KuaiLe', cursive;
    font-size: 12px; color: #8b5a3c; letter-spacing: 0.05em; margin-bottom: 4px;
  }
  .e-stat-value {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 30px; color: #d4502a;
    line-height: 1; font-variant-numeric: tabular-nums;
  }
  .e-stat-value-sm { font-size: 20px; }
  .e-stat-unit { font-size: 18px; margin-left: 2px; color: #b8431a; }
  .e-progress { height: 10px; background: #fff5b8; margin-bottom: 14px; position: relative; overflow: hidden; border-radius: 999px; border: 1.5px solid #ffd966; z-index: 2; }
  .e-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ffec8a 0%, #ffb84a 50%, #ff8a50 100%);
    transition: width 0.5s ease; border-radius: 999px;
    box-shadow: 0 0 12px rgba(255, 180, 80, 0.7);
  }
  .e-footer {
    display: flex; align-items: center; gap: 6px; justify-content: center;
    font-family: 'ZCOOL KuaiLe', cursive;
    font-size: 13px; letter-spacing: 0.05em;
    color: #b8431a; background: #fff5b8;
    padding: 8px 14px; border-radius: 999px;
    border: 1.5px dashed #ffb84a; position: relative; z-index: 2;
  }
  
  /* === 摆烂主题：奶油草莓樱花 === */
  .chill-view {
    position: relative;
    background:
      radial-gradient(circle at 25% 15%, #fff5fa 0%, transparent 40%),
      radial-gradient(circle at 75% 85%, #ffd6e8 0%, transparent 45%),
      linear-gradient(135deg, #fff5fa 0%, #ffe4ec 50%, #ffd6e8 100%);
    padding: 36px 28px; border-radius: 32px;
    color: #8c5a72; overflow: hidden;
    box-shadow: 0 16px 50px rgba(244, 168, 212, 0.3), inset 0 0 0 4px rgba(255,255,255,0.6);
    border: 2.5px solid #ffc4dc;
    min-height: 480px;
  }
  /* 内层蕾丝边 */
  .chill-view::before {
    content: ""; position: absolute; inset: 10px;
    border: 2px dashed #fbcfe8; border-radius: 26px;
    pointer-events: none; opacity: 0.7;
  }
  /* 顶部蝴蝶结彩带条 */
  .chill-view::after {
    content: "♡ ✿ ♡ ✿ ♡ ✿ ♡ ✿ ♡ ✿ ♡ ✿ ♡ ✿ ♡ ✿ ♡ ✿ ♡ ✿";
    position: absolute; top: -2px; left: 0; right: 0;
    text-align: center; font-size: 10px; color: #f9a8d4;
    letter-spacing: 0.3em; opacity: 0.6;
    padding: 4px 0; pointer-events: none;
  }
  .c-clouds {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.7) 0%, transparent 28%),
      radial-gradient(circle at 20% 80%, rgba(255,222,237,0.6) 0%, transparent 35%),
      radial-gradient(circle at 50% 50%, rgba(255,235,245,0.5) 0%, transparent 40%);
  }
  .c-floating-emoji {
    position: absolute; font-size: 22px; opacity: 0.6;
    top: 24px; right: 30px;
    animation: float 6s ease-in-out infinite;
    animation-delay: var(--delay, 0s); pointer-events: none;
    filter: drop-shadow(0 2px 4px rgba(244, 168, 212, 0.4));
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(-5deg); }
    50% { transform: translateY(-14px) rotate(8deg); }
  }
  .c-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; position: relative; z-index: 2; }
  .c-mood { font-size: 28px; filter: drop-shadow(0 2px 4px rgba(244, 168, 212, 0.4)); }
  .c-mood-text {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 16px; color: #c2185b;
    background: #fff5fa; padding: 4px 14px; border-radius: 999px;
    border: 1.5px dashed #f9a8d4;
  }
  .c-status {
    font-family: 'ZCOOL KuaiLe', 'Noto Sans SC', cursive;
    font-size: 17px; color: #db6ba2;
    margin-bottom: 16px; position: relative; z-index: 2;
    background: rgba(255, 245, 250, 0.7); padding: 6px 14px;
    width: fit-content; border-radius: 999px;
    border: 1.5px dotted #fbcfe8;
  }
  .c-progress-wrap { margin-bottom: 14px; position: relative; z-index: 2; }
  .c-progress-track {
    height: 16px; background: #fff0f7;
    border-radius: 999px; overflow: visible;
    position: relative; margin-bottom: 8px;
    border: 1.5px solid #fbcfe8;
    box-shadow: inset 0 1px 3px rgba(244, 168, 212, 0.2);
  }
  .c-progress-fill {
    height: 100%; background: linear-gradient(90deg, #fbcfe8 0%, #f9a8d4 50%, #db6ba2 100%);
    border-radius: 999px; position: relative; transition: width 0.5s ease;
    box-shadow: 0 0 10px rgba(244, 168, 212, 0.6);
  }
  .c-progress-dot { position: absolute; right: -4px; top: 50%; transform: translate(50%, -50%); font-size: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
  .c-progress-text { font-family: 'ZCOOL KuaiLe', cursive; font-size: 13px; color: #c2185b; text-align: center; }
  .c-remaining {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-family: 'ZCOOL KuaiLe', cursive; font-size: 13px; color: #c2185b;
    margin-bottom: 12px; font-variant-numeric: tabular-nums; position: relative; z-index: 2;
    background: #fff5fa; padding: 6px 14px;
    width: fit-content; margin-left: auto; margin-right: auto;
    border-radius: 999px; border: 1.5px dashed #fbcfe8;
  }
  .c-footer {
    text-align: center; font-family: 'ZCOOL KuaiLe', cursive;
    font-size: 13px; color: #db6ba2; position: relative; z-index: 2;
    letter-spacing: 0.1em;
  }
  
  /* === 摸鱼小卡片 === */
  .moyu-card {
    border-radius: 22px; padding: 20px; align-self: start; transition: all 0.3s;
    position: relative; border: 2px dashed transparent;
  }
  .moyu-miserable { background: #fff5ec; border-color: #ffb893; color: #8b3e2a; box-shadow: 0 6px 18px rgba(220, 130, 100, 0.18); }
  .moyu-energetic { background: #fff8e6; border-color: #ffb84a; color: #b8431a; box-shadow: 0 6px 18px rgba(255, 180, 80, 0.25); }
  .moyu-chill { background: #fff5fa; border-color: #fbcfe8; color: #c2185b; border-radius: 28px; box-shadow: 0 6px 18px rgba(244, 168, 212, 0.2); }
  .moyu-active { box-shadow: 0 0 0 3px rgba(95, 191, 140, 0.3), 0 0 30px rgba(95, 191, 140, 0.2); }
  .moyu-header { display: flex; align-items: center; gap: 8px; font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 16px; margin-bottom: 14px; letter-spacing: 0.03em; }
  .moyu-live-dot { margin-left: auto; width: 10px; height: 10px; background: #5fbf8c; border-radius: 50%; animation: blink 1s infinite; box-shadow: 0 0 8px #5fbf8c; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .moyu-session {
    background: linear-gradient(135deg, #e8f7ee 0%, #d4f4dd 100%);
    border: 1.5px dashed #5fbf8c; border-radius: 16px;
    padding: 14px; text-align: center; margin-bottom: 14px;
  }
  .moyu-session-label { font-family: 'ZCOOL KuaiLe', cursive; font-size: 13px; opacity: 0.95; letter-spacing: 0.05em; margin-bottom: 4px; color: #2f8559; }
  .moyu-session-time {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 28px; font-variant-numeric: tabular-nums;
    color: #2f8559; margin-bottom: 4px;
    text-shadow: 0 2px 0 #fff;
  }
  .moyu-session-earned { font-family: 'ZCOOL KuaiLe', cursive; font-size: 14px; color: #2f8559; }
  .moyu-btn {
    width: 100%; padding: 12px; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #5fbf8c 0%, #2f8559 100%);
    color: white; font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 16px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    margin-bottom: 14px; transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(95, 191, 140, 0.4);
  }
  .moyu-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(95, 191, 140, 0.5); }
  .moyu-totals { border-top: 1.5px dotted currentColor; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; opacity: 0.85; }
  .moyu-total-row { display: flex; justify-content: space-between; font-family: 'ZCOOL KuaiLe', cursive; font-size: 14px; }
  .moyu-total-label { opacity: 0.8; }
  .moyu-total-value { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-variant-numeric: tabular-nums; }
  .moyu-total-money { color: #2f8559; }
  
  /* === 加班赚钱卡（暖色） === */
  .ot-paid {
    border: 2.5px dashed; border-radius: 22px;
    padding: 22px 20px; text-align: center; align-self: start;
    position: relative;
  }
  .ot-miserable.ot-paid { background: #fff5ec; border-color: #ffb893; color: #8b3e2a; }
  .ot-energetic.ot-paid { background: #fff8e6; border-color: #ffb84a; color: #b8431a; transform: rotate(0.4deg); }
  .ot-chill.ot-paid { background: #fff5fa; border-color: #fbcfe8; color: #c2185b; border-radius: 28px; }
  .ot-paid-waiting { opacity: 0.7; }
  .ot-paid-title {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 16px; letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .ot-paid-title::before { content: "✿ "; }
  .ot-paid-title::after { content: " ✿"; }
  .ot-paid-sub { font-family: 'ZCOOL KuaiLe', cursive; font-size: 13px; opacity: 0.85; }
  .ot-paid-header {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 15px;
    margin-bottom: 14px;
  }
  .ot-paid-amount { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin-bottom: 10px; }
  .ot-paid-currency { font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 24px; }
  .ot-paid-number {
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 44px; font-variant-numeric: tabular-nums;
    text-shadow: 0 3px 0 #fff;
  }
  .ot-paid-time {
    font-family: 'ZCOOL KuaiLe', cursive; font-size: 13px;
    opacity: 0.85; margin-bottom: 12px;
    font-variant-numeric: tabular-nums;
    background: rgba(255,255,255,0.5); padding: 4px 12px;
    border-radius: 999px; display: inline-block;
  }
  .ot-paid-total {
    border-top: 1.5px dotted currentColor; padding-top: 12px;
    font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 15px;
  }
  
  /* === 加班自救（暖色） === */
  .ot-care {
    border: 2.5px dashed; border-radius: 22px;
    padding: 22px 20px; align-self: start;
  }
  .ot-miserable.ot-care { background: #fff5fa; border-color: #f9a8d4; color: #c2185b; }
  .ot-energetic.ot-care { background: #fff5fa; border-color: #f9a8d4; color: #c2185b; }
  .ot-chill.ot-care { background: #fff5fa; border-color: #f9a8d4; border-radius: 28px; color: #c2185b; }
  .ot-care-header {
    display: flex; align-items: center; gap: 8px;
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 16px; margin-bottom: 14px; color: #db6ba2;
  }
  .ot-miserable .ot-care-header,
  .ot-energetic .ot-care-header,
  .ot-chill .ot-care-header { color: #db6ba2; }
  .ot-care-empty { text-align: center; padding: 8px 0; }
  .ot-care-empty-emoji { font-size: 36px; margin-bottom: 6px; }
  .ot-care-empty-sub { font-size: 12px; opacity: 0.75; margin-top: 4px; }
  .ot-care-energy-label { font-family: 'ZCOOL KuaiLe', cursive; font-size: 13px; margin-bottom: 10px; opacity: 0.95; }
  .ot-care-slider-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .ot-care-slider {
    flex: 1; -webkit-appearance: none; appearance: none;
    height: 8px; background: #fff0f7; border-radius: 999px;
    outline: none; cursor: pointer; border: 1.5px solid #fbcfe8;
  }
  .ot-care-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px; height: 22px; border-radius: 50%;
    background: linear-gradient(135deg, #f9a8d4, #db6ba2);
    cursor: pointer; box-shadow: 0 2px 8px rgba(219, 107, 162, 0.5);
    border: 2px solid #fff;
  }
  .ot-care-slider-value {
    display: flex; align-items: baseline;
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-variant-numeric: tabular-nums;
    min-width: 56px; color: #db6ba2;
  }
  .ot-care-slider-num { font-size: 26px; }
  .ot-care-slider-unit { font-size: 13px; opacity: 0.7; }
  .ot-care-bar {
    height: 8px; background: #fff0f7;
    border-radius: 999px; overflow: hidden; margin-bottom: 14px;
    border: 1.5px solid #fbcfe8;
  }
  .ot-care-bar-fill { height: 100%; transition: all 0.3s; border-radius: 999px; box-shadow: 0 0 8px rgba(244, 168, 212, 0.5); }
  .ot-care-message {
    display: flex; align-items: flex-start; gap: 10px;
    background: #fff5fa; padding: 12px 14px; border-radius: 14px;
    font-family: 'ZCOOL KuaiLe', cursive; font-size: 14px; line-height: 1.55;
    color: #8c5a72; border: 1.5px dashed #fbcfe8;
  }
  .ot-care-alert {
    margin-top: 12px; padding: 10px 14px;
    background: #fff0f0; border: 1.5px dashed #ff9b9b;
    border-radius: 14px; font-family: 'ZCOOL KuaiLe', cursive;
    font-size: 13px; color: #d4502a; text-align: center;
  }
  
  .ot-switcher {
    display: flex; align-items: center; gap: 8px;
    width: 100%; max-width: 920px; flex-wrap: wrap;
    padding: 10px 18px; background: rgba(255,255,255,0.7);
    border-radius: 999px; backdrop-filter: blur(8px);
    border: 1.5px dashed rgba(255,255,255,0.95);
    box-shadow: 0 4px 14px rgba(160, 100, 80, 0.1);
  }
  .ot-switcher-label { font-family: 'ZCOOL KuaiLe', cursive; font-size: 14px; opacity: 0.85; margin-right: 4px; }
  .ot-btn {
    background: transparent; border: 1.5px solid transparent;
    color: inherit; padding: 6px 14px; border-radius: 999px;
    cursor: pointer; font-family: inherit; font-size: 13px;
    opacity: 0.75; transition: all 0.25s;
  }
  .ot-btn:hover { opacity: 1; transform: translateY(-1px); }
  .ot-btn.active { opacity: 1; }
  .theme-miserable .ot-btn.active { background: #ffd6c2; color: #8b3e2a; box-shadow: 0 3px 8px rgba(220, 130, 100, 0.25); }
  .theme-energetic .ot-btn.active { background: #fff5b8; color: #b8431a; box-shadow: 0 3px 8px rgba(255, 180, 80, 0.3); }
  .theme-chill .ot-btn.active { background: #fbcfe8; color: #c2185b; box-shadow: 0 3px 8px rgba(244, 168, 212, 0.4); }
  
  /* === 设置面板（暖奶油） === */
  .settings-overlay {
    position: fixed; inset: 0;
    background: rgba(255, 230, 214, 0.65); backdrop-filter: blur(8px);
    z-index: 100; display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .settings-panel {
    background:
      radial-gradient(circle at 15% 10%, #fff8ed 0%, transparent 50%),
      radial-gradient(circle at 85% 90%, #ffe4ec 0%, transparent 50%),
      #fff5ec;
    color: #6d4530; padding: 28px;
    border-radius: 24px; width: 100%; max-width: 460px;
    max-height: 85vh; overflow-y: auto;
    border: 2.5px dashed #ffb893;
    box-shadow: 0 20px 60px rgba(220, 130, 100, 0.25);
    font-family: 'Noto Sans SC', sans-serif;
    position: relative;
  }
  .settings-panel::before {
    content: "✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿ ❀ ✿";
    position: absolute; top: 8px; left: 12px; right: 12px;
    text-align: center; font-size: 11px;
    color: #f0a890; letter-spacing: 0.4em; opacity: 0.6;
  }
  .settings-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 18px; font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 18px; color: #b8451f;
    padding-top: 12px;
  }
  .settings-close {
    background: #fff5ec; border: 1.5px solid #ffb893;
    color: #b8451f; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 50%;
  }
  .settings-close:hover { background: #ffd6c2; transform: rotate(90deg); transition: all 0.3s; }
  .settings-tabs {
    display: flex; gap: 6px;
    background: #fff8ed; border: 1.5px dashed #ffc4a3;
    border-radius: 14px; padding: 4px; margin-bottom: 18px;
  }
  .s-tab {
    flex: 1; background: transparent; border: none;
    color: #b87a52; padding: 8px;
    border-radius: 10px; font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-size: 14px; cursor: pointer; transition: all 0.2s;
  }
  .s-tab.active { background: #ffd6c2; color: #8b3e2a; box-shadow: 0 2px 6px rgba(220, 130, 100, 0.2); }
  .settings-body { display: flex; flex-direction: column; gap: 14px; }
  .settings-row {
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'ZCOOL KuaiLe', cursive; font-size: 14px; color: #8b5a3c;
  }
  .settings-row label { color: #8b5a3c; }
  .settings-row input {
    background: #fff8ed; border: 1.5px solid #ffc4a3;
    color: #6d4530; padding: 8px 12px;
    border-radius: 10px; font-size: 14px;
    font-family: inherit; width: 150px;
    font-variant-numeric: tabular-nums;
  }
  .settings-row input:focus { outline: none; border-color: #ff9b7a; box-shadow: 0 0 0 3px rgba(255, 155, 122, 0.2); }
  .settings-save {
    width: 100%; margin-top: 14px; padding: 12px;
    background: linear-gradient(135deg, #ffb893 0%, #ff9b7a 100%);
    color: #fff; border: none; border-radius: 14px;
    font-family: 'ZCOOL QingKe HuangYou', cursive;
    font-weight: 700; cursor: pointer; font-size: 16px;
    box-shadow: 0 4px 12px rgba(255, 155, 122, 0.4);
    transition: all 0.2s;
  }
  .settings-save:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(255, 155, 122, 0.5); }
  
  .editor-label { font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 16px; color: #b8451f; }
  .editor-hint { font-family: 'ZCOOL KuaiLe', cursive; font-size: 12px; color: #b87a52; margin-bottom: 8px; }
  .editor-add {
    display: grid; grid-template-columns: 56px 1fr 80px 38px;
    gap: 8px; margin-bottom: 12px;
  }
  .editor-add input {
    background: #fff8ed; border: 1.5px solid #ffc4a3;
    color: #6d4530; padding: 8px;
    border-radius: 10px; font-size: 13px;
    font-family: inherit; width: 100%; box-sizing: border-box;
  }
  .editor-add input:focus { outline: none; border-color: #ff9b7a; box-shadow: 0 0 0 3px rgba(255, 155, 122, 0.2); }
  .editor-emoji-input { text-align: center; font-size: 18px !important; }
  .editor-price-input { font-variant-numeric: tabular-nums; }
  .editor-add-btn {
    background: linear-gradient(135deg, #ffb893 0%, #ff9b7a 100%);
    color: #fff; border: none; border-radius: 10px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 8px rgba(255, 155, 122, 0.3);
  }
  .editor-add-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 12px rgba(255, 155, 122, 0.4); }
  .editor-list {
    max-height: 280px; overflow-y: auto;
    border-top: 1.5px dotted #ffc4a3; padding-top: 10px;
  }
  .editor-item {
    display: grid; grid-template-columns: 36px 1fr 70px 30px;
    align-items: center; gap: 8px; padding: 8px 0;
    border-bottom: 1px dotted #ffd6c2;
    font-family: 'ZCOOL KuaiLe', cursive; font-size: 14px;
  }
  .editor-item-emoji { font-size: 20px; text-align: center; }
  .editor-item-name { color: #6d4530; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .editor-item-price { color: #b8451f; font-variant-numeric: tabular-nums; text-align: right; }
  .editor-item-remove {
    background: transparent; border: 1.5px solid #ffc4a3;
    color: #b87a52; cursor: pointer; padding: 3px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .editor-item-remove:hover { color: #d4502a; border-color: #ff9b7a; background: #fff5ec; }
  
  /* === 里程碑庆祝 === */
  .celebration { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); animation: cel-fade 0.3s; cursor: pointer; }
  @keyframes cel-fade { from { opacity: 0; } to { opacity: 1; } }
  .celebration-miserable { background: rgba(255, 214, 194, 0.85); }
  .celebration-energetic { background: rgba(255, 184, 138, 0.7); }
  .celebration-chill { background: rgba(255, 214, 232, 0.85); }
  .celebration-inner { text-align: center; position: relative; padding: 40px 60px; animation: cel-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes cel-pop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .celebration-emoji { font-size: 100px; margin-bottom: 12px; animation: cel-bounce 1.5s ease-in-out infinite; }
  @keyframes cel-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
  .celebration-amount { font-family: 'Archivo Black', sans-serif; font-size: 56px; font-weight: 900; line-height: 1; margin-bottom: 8px; }
  .celebration-miserable .celebration-amount { color: #b8451f; font-family: 'ZCOOL QingKe HuangYou', cursive; text-shadow: 0 4px 0 #fff; }
  .celebration-energetic .celebration-amount { color: #d4502a; text-shadow: 4px 4px 0 #fff5b8, 0 6px 12px rgba(180,80,30,0.3); font-family: 'ZCOOL QingKe HuangYou', cursive; }
  .celebration-chill .celebration-amount { color: #c2185b; font-family: 'ZCOOL QingKe HuangYou', cursive; text-shadow: 0 4px 0 #fff; }
  .celebration-message { font-family: 'ZCOOL QingKe HuangYou', cursive; font-size: 20px; }
  .celebration-miserable .celebration-message { color: #8b3e2a; }
  .celebration-energetic .celebration-message { color: #b8431a; }
  .celebration-chill .celebration-message { color: #db6ba2; font-family: 'ZCOOL KuaiLe', cursive; }
  .celebration-effect { position: absolute; inset: 0; pointer-events: none; }
  .confetti-piece { position: absolute; top: 50%; left: 50%; width: 8px; height: 14px; border-radius: 2px; animation: confetti-burst 1.5s ease-out forwards; animation-delay: var(--delay); }
  @keyframes confetti-burst { 0% { transform: translate(0, 0) rotate(0); opacity: 1; } 100% { transform: translate(var(--x), var(--y)) rotate(var(--rot)); opacity: 0; } }
  .sparkle { position: absolute; top: 50%; left: 50%; font-size: 24px; animation: sparkle-burst 1.8s ease-out forwards; animation-delay: var(--delay); }
  @keyframes sparkle-burst { 0% { transform: translate(0, 0) scale(0); opacity: 0; } 30% { opacity: 1; transform: translate(calc(var(--x) * 0.5), calc(var(--y) * 0.5)) scale(1.2); } 100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; } }
  .tear { position: absolute; top: 30%; left: 50%; font-size: 28px; animation: tear-fall 2s ease-in forwards; animation-delay: var(--delay); }
  @keyframes tear-fall { 0% { transform: translate(0, 0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(var(--x), 300px); opacity: 0; } }

  .celebration-mascot {
    position: absolute; top: -50px; left: 50%; transform: translateX(-50%);
    width: 320px; height: 320px; object-fit: cover; border-radius: 50%;
    border: 8px solid #fff; box-shadow: 0 16px 50px rgba(0,0,0,0.35);
    animation: cel-mascot-spin 2s ease-in-out infinite alternate;
    opacity: 0.95; z-index: -1;
  }
  @keyframes cel-mascot-spin {
    0% { transform: translateX(-50%) rotate(-5deg) scale(1); }
    100% { transform: translateX(-50%) rotate(5deg) scale(1.04); }
  }
  .celebration-energetic .celebration-mascot { border-color: #ffeb3b; }
  .celebration-chill .celebration-mascot { border-color: #fbcfe8; }
  .celebration-miserable .celebration-mascot { border-color: #d4c4a8; opacity: 0.85; }

  /* === 小狗使者：浮动按钮 === */
  .mascot-btn {
    position: fixed; right: 24px; bottom: 24px; z-index: 80;
    width: 92px; height: 92px; border-radius: 50%;
    border: 4px solid #fff; cursor: pointer; padding: 0;
    background: #fff; overflow: visible;
    box-shadow: 0 14px 32px rgba(0,0,0,0.28), 0 0 0 0 rgba(251,191,36,0);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
    animation: mascot-bob 4s ease-in-out infinite;
  }
  .mascot-btn:hover { transform: translateY(-5px) rotate(-6deg) scale(1.1); }
  @keyframes mascot-bob {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-6px) rotate(2deg); }
  }
  .mascot-btn-img {
    width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
    display: block; pointer-events: none;
  }
  .mascot-btn-bone {
    position: absolute; right: -6px; bottom: -6px;
    width: 36px; height: 36px; border-radius: 50%;
    background: #fbbf24; color: #1a0f00; border: 3px solid #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
  }
  .mascot-btn-energetic { border-color: #ffeb3b; }
  .mascot-btn-energetic .mascot-btn-bone { background: #ffeb3b; }
  .mascot-btn-chill { border-color: #fbcfe8; }
  .mascot-btn-chill .mascot-btn-bone { background: #f9a8d4; color: #fff; }
  .mascot-btn-miserable { border-color: #d4c4a8; }
  .mascot-btn-miserable .mascot-btn-bone { background: #c43f3f; color: #fff; }
  .mascot-btn-new {
    animation: mascot-bob 4s ease-in-out infinite, mascot-pulse 1.6s ease-out infinite;
  }
  @keyframes mascot-pulse {
    0% { box-shadow: 0 10px 26px rgba(0,0,0,0.28), 0 0 0 0 rgba(251,191,36,0.5); }
    70% { box-shadow: 0 10px 26px rgba(0,0,0,0.28), 0 0 0 14px rgba(251,191,36,0); }
    100% { box-shadow: 0 10px 26px rgba(0,0,0,0.28), 0 0 0 0 rgba(251,191,36,0); }
  }
  .mascot-btn-dot {
    position: absolute; top: -2px; left: -2px; width: 14px; height: 14px;
    background: #ef4444; border: 2px solid #fff; border-radius: 50%;
    animation: blink 1s infinite;
  }

  /* === 小狗使者：卡片（拍立得风） === */
  .mascot-overlay {
    position: fixed; inset: 0; z-index: 150;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; animation: cel-fade 0.25s ease-out;
  }
  .mascot-overlay-chill { background: rgba(255, 222, 237, 0.6); }
  .mascot-overlay-energetic { background: rgba(255, 80, 0, 0.5); }
  .mascot-overlay-miserable { background: rgba(0, 0, 0, 0.78); }

  .mascot-card {
    position: relative; width: 100%; max-width: 460px;
    background: #fffaf2; color: #2a2520;
    padding: 22px 22px 24px; border-radius: 8px;
    box-shadow: 0 28px 70px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.04);
    transform: rotate(var(--tilt, 0deg));
    animation: mascot-card-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-family: 'Noto Sans SC', sans-serif;
  }
  @keyframes mascot-card-pop {
    from { transform: rotate(var(--tilt, 0deg)) scale(0.5) translateY(40px); opacity: 0; }
    to { transform: rotate(var(--tilt, 0deg)) scale(1) translateY(0); opacity: 1; }
  }
  .mascot-close {
    position: absolute; top: 8px; right: 8px; z-index: 3;
    width: 28px; height: 28px; border-radius: 50%; border: none;
    background: rgba(0,0,0,0.08); color: #5a4f47; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .mascot-close:hover { background: rgba(0,0,0,0.18); }
  .mascot-tape {
    position: absolute; top: -8px; width: 70px; height: 22px;
    background: rgba(252, 211, 77, 0.7); transform: rotate(-6deg);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .mascot-tape-l { left: 14px; }
  .mascot-tape-r { right: 14px; transform: rotate(6deg); background: rgba(244, 114, 182, 0.6); }

  .mascot-img-wrap {
    position: relative; aspect-ratio: 1 / 1; width: 100%;
    background: #1a0f00; overflow: hidden; margin-bottom: 14px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
  }
  .mascot-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    animation: mascot-img-in 0.5s ease-out;
  }
  @keyframes mascot-img-in {
    from { transform: scale(1.08); filter: blur(6px); opacity: 0; }
    to { transform: scale(1); filter: blur(0); opacity: 1; }
  }
  .mascot-stars { position: absolute; inset: 0; pointer-events: none; }
  .mascot-star {
    position: absolute; top: 50%; left: 50%; font-size: 22px;
    animation: sparkle-burst 1.6s ease-out forwards;
    animation-delay: var(--md, 0s);
  }

  .mascot-text { text-align: center; padding: 0 4px; }
  .mascot-title {
    font-family: 'ZCOOL QingKe HuangYou', 'Noto Sans SC', sans-serif;
    font-size: 22px; color: #1a0f00; margin-bottom: 4px;
    letter-spacing: 0.04em;
  }
  .mascot-quote {
    font-size: 14px; color: #6b5d52; line-height: 1.55;
    font-family: 'Noto Serif SC', serif;
  }
  .mascot-actions {
    display: flex; gap: 8px; margin-top: 16px;
  }
  .mascot-reroll, .mascot-ok {
    flex: 1; padding: 10px; border-radius: 999px; cursor: pointer;
    font-family: inherit; font-size: 13px; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    transition: transform 0.15s, background 0.2s;
  }
  .mascot-reroll {
    background: transparent; color: #5a4f47;
    border: 1.5px dashed #c4b5a4;
  }
  .mascot-reroll:hover { background: #fef3c7; transform: translateY(-1px); }
  .mascot-ok {
    background: #1a0f00; color: #fef3c7; border: none;
  }
  .mascot-ok:hover { background: #3a2a18; transform: translateY(-1px); }
  .mascot-meta {
    text-align: center; font-size: 10px; color: #a8998a;
    letter-spacing: 0.25em; margin-top: 12px; text-transform: uppercase;
  }

  /* === 小狗使者：贴纸提示 === */
  .mascot-toast {
    position: fixed; bottom: 110px; z-index: 70;
    display: flex; align-items: flex-end; gap: 10px;
    cursor: pointer; max-width: 320px; padding: 6px;
  }
  .mascot-toast.from-l { left: 16px; animation: toast-slide-l 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), toast-out 0.5s ease-in 7s forwards; }
  .mascot-toast.from-r { right: 100px; animation: toast-slide-r 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), toast-out 0.5s ease-in 7s forwards; }
  @keyframes toast-slide-l { from { transform: translateX(-120%) rotate(-12deg); opacity: 0; } to { transform: translateX(0) rotate(-3deg); opacity: 1; } }
  @keyframes toast-slide-r { from { transform: translateX(120%) rotate(12deg); opacity: 0; } to { transform: translateX(0) rotate(3deg); opacity: 1; } }
  @keyframes toast-out { to { opacity: 0; transform: translateY(20px) scale(0.9); } }
  .mascot-toast-img {
    width: 88px; height: 88px; object-fit: cover; border-radius: 50%;
    border: 4px solid #fff; box-shadow: 0 8px 22px rgba(0,0,0,0.3);
    flex-shrink: 0;
  }
  .mascot-toast-bubble {
    background: #fff; color: #2a2520; padding: 10px 14px;
    border-radius: 14px 14px 14px 4px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    font-family: 'Noto Sans SC', sans-serif;
    position: relative;
  }
  .mascot-toast.from-r .mascot-toast-bubble {
    border-radius: 14px 14px 4px 14px;
  }
  .mascot-toast-title {
    font-family: 'ZCOOL QingKe HuangYou', 'Noto Sans SC', sans-serif;
    font-size: 14px; margin-bottom: 2px; color: #1a0f00;
  }
  .mascot-toast-quote { font-size: 12px; color: #6b5d52; line-height: 1.45; }
  .mascot-toast-energetic .mascot-toast-bubble { background: #1a0f00; color: #fef3c7; }
  .mascot-toast-energetic .mascot-toast-title { color: #ffeb3b; }
  .mascot-toast-energetic .mascot-toast-quote { color: #fef3c7; }
  .mascot-toast-miserable .mascot-toast-bubble { background: #1a1410; color: #d4c4a8; border: 1px solid #3a2f28; }
  .mascot-toast-miserable .mascot-toast-title { color: #d4c4a8; font-family: 'Noto Serif SC', serif; }
  .mascot-toast-miserable .mascot-toast-quote { color: #b89e8a; font-style: italic; }
  .mascot-toast-chill .mascot-toast-bubble { background: #fff5fa; }

  @media (max-width: 760px) {
    .mascot-toast.from-r { right: 16px; bottom: 100px; }
    .mascot-toast.from-l { bottom: 100px; }
    .mascot-btn { right: 14px; bottom: 14px; width: 58px; height: 58px; }
  }

  /* === 内联小狗（在卡片里） === */
  .mascot-inline {
    display: flex; align-items: center; gap: 12px;
    padding: 10px; border-radius: 12px;
    background: rgba(255,255,255,0.06);
  }
  .mascot-inline-chill { background: rgba(255, 245, 250, 0.7); }
  .mascot-inline-energetic { background: rgba(0,0,0,0.25); }
  .mascot-inline-miserable { background: rgba(212, 196, 168, 0.06); }
  .mascot-inline-img {
    width: 84px; height: 84px; border-radius: 50%; object-fit: cover;
    border: 3px solid currentColor; flex-shrink: 0;
    animation: mascot-bob 3.5s ease-in-out infinite;
    box-shadow: 0 4px 12px rgba(160, 100, 80, 0.2);
  }
  .mascot-inline-text { flex: 1; min-width: 0; }
  .mascot-inline-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; font-family: 'ZCOOL QingKe HuangYou', cursive; }
  .mascot-inline-sub { font-size: 12px; opacity: 0.75; }
`;
