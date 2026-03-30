/**
 * Tiangong Space Station Canvas Animation
 * 天宫空间站 Canvas 动画效果
 */

(function() {
  'use strict';

  // 检查是否禁用动画
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // 检查是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  // Canvas 设置
  let canvas, ctx;
  let width, height;
  let animationId;

  // 天宫空间站参数
  const station = {
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
    opacity: 0,
    phase: 0, // 轨道相位 0-1
    speed: isMobile ? 0.0008 : 0.0005, // 移动端加速
    trailPoints: []
  };

  // 轨道参数（椭圆）
  const orbit = {
    centerX: 0.5, // 相对位置
    centerY: 0.6,
    radiusX: 0.4,
    radiusY: 0.5,
    rotation: -0.3 // 轨道倾斜角度
  };

  // 文字交互参数
  const textInteraction = {
    active: false,
    targetSelector: 'h1, h2, .home-title, .profile-name',
    chars: [],
    originalPositions: []
  };

  // 初始化
  function init() {
    createCanvas();
    setupTextInteraction();
    resize();
    window.addEventListener('resize', resize);
    animate();
  }

  // 创建 Canvas
  function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'tiangong-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d', { alpha: true });
  }

  // 调整画布大小
  function resize() {
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
  }

  // 绘制天宫空间站（线框风格）
  function drawStation(x, y, scale, opacity, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    const isDark = document.documentElement.classList.contains('dark');
    const color = isDark ? 'rgba(100, 180, 255, 0.9)' : 'rgba(70, 130, 200, 0.8)';
    const glowColor = 'rgba(100, 180, 255, 0.6)';

    ctx.strokeStyle = color;
    ctx.lineWidth = isMobile ? 1.5 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 发光效果
    if (!isMobile) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
    }

    // 主体核心舱（Tianhe core module）- 圆柱形
    ctx.beginPath();
    ctx.rect(-25, -6, 50, 12);
    ctx.stroke();

    // 核心舱细节
    ctx.beginPath();
    ctx.moveTo(-15, -6);
    ctx.lineTo(-15, 6);
    ctx.moveTo(15, -6);
    ctx.lineTo(15, 6);
    ctx.stroke();

    // 左侧实验舱（Wentian）
    ctx.beginPath();
    ctx.rect(-60, -5, 30, 10);
    ctx.stroke();

    // 右侧实验舱（Mengtian）
    ctx.beginPath();
    ctx.rect(30, -5, 30, 10);
    ctx.stroke();

    // 左侧太阳能板
    drawSolarPanel(-70, 0, -1);
    
    // 右侧太阳能板
    drawSolarPanel(70, 0, 1);

    // 对接口
    ctx.beginPath();
    ctx.arc(-25, 0, 3, 0, Math.PI * 2);
    ctx.arc(25, 0, 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 绘制太阳能板
  function drawSolarPanel(x, y, direction) {
    ctx.save();
    ctx.translate(x, y);

    // 连接杆
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(direction * 15, 0);
    ctx.stroke();

    // 太阳能板（4块）
    const panelWidth = isMobile ? 8 : 12;
    const panelHeight = isMobile ? 20 : 30;
    const gap = 2;
    
    for (let i = 0; i < 4; i++) {
      const px = direction * (15 + i * (panelWidth + gap));
      ctx.beginPath();
      ctx.rect(px, -panelHeight / 2, panelWidth, panelHeight);
      ctx.stroke();

      // 太阳能板格子细节
      if (!isMobile) {
        ctx.beginPath();
        for (let j = 1; j < 3; j++) {
          ctx.moveTo(px, -panelHeight / 2 + (panelHeight * j / 3));
          ctx.lineTo(px + panelWidth, -panelHeight / 2 + (panelHeight * j / 3));
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 绘制尾迹
  function drawTrail() {
    if (station.trailPoints.length < 2) return;

    const isDark = document.documentElement.classList.contains('dark');
    const baseColor = isDark ? '100, 180, 255' : '70, 130, 200';

    ctx.save();
    
    for (let i = 1; i < station.trailPoints.length; i++) {
      const point = station.trailPoints[i];
      const prevPoint = station.trailPoints[i - 1];
      const alpha = point.life * station.opacity * 0.3;

      ctx.strokeStyle = `rgba(${baseColor}, ${alpha})`;
      ctx.lineWidth = point.width;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 更新轨道位置
  function updateOrbit() {
    station.phase += station.speed;
    if (station.phase > 1) station.phase = 0;

    // 椭圆轨道计算
    const angle = station.phase * Math.PI * 2;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const cosRot = Math.cos(orbit.rotation);
    const sinRot = Math.sin(orbit.rotation);

    const x = orbit.radiusX * cosAngle;
    const y = orbit.radiusY * sinAngle;

    // 旋转椭圆
    station.x = (x * cosRot - y * sinRot) * width + orbit.centerX * width;
    station.y = (x * sinRot + y * cosRot) * height + orbit.centerY * height;

    // 根据相位调整缩放和透明度
    if (station.phase < 0.15) {
      // 进入阶段
      station.opacity = station.phase / 0.15;
      station.scale = 0.6 + 0.4 * station.opacity;
    } else if (station.phase > 0.85) {
      // 退出阶段
      const fadeOut = (1 - station.phase) / 0.15;
      station.opacity = fadeOut;
      station.scale = 0.6 + 0.4 * fadeOut;
    } else {
      // 中间阶段
      station.opacity = 0.7 + 0.3 * Math.sin((station.phase - 0.15) * Math.PI / 0.7);
      station.scale = 0.8 + 0.2 * Math.sin((station.phase - 0.15) * Math.PI / 0.7);
    }

    // 轻微旋转
    station.angle = Math.sin(angle) * 0.1;

    // 更新尾迹
    updateTrail();
  }

  // 更新尾迹
  function updateTrail() {
    const maxPoints = isMobile ? 15 : 30;
    
    station.trailPoints.push({
      x: station.x,
      y: station.y,
      life: 1,
      width: isMobile ? 2 : 3
    });

    // 更新现有点的生命值
    station.trailPoints = station.trailPoints.filter(point => {
      point.life -= isMobile ? 0.08 : 0.05;
      point.width *= 0.96;
      return point.life > 0;
    });

    // 限制点数
    if (station.trailPoints.length > maxPoints) {
      station.trailPoints.shift();
    }
  }

  // 文字交互设置
  function setupTextInteraction() {
    // 此功能在首页最有效，暂时简化实现
    // 完整实现需要解析文字DOM，提取字符位置，实时监测碰撞
    // 考虑到性能，先预留接口
    textInteraction.active = false;
  }

  // 检测文字碰撞（简化版本）
  function checkTextCollision() {
    if (!textInteraction.active) return;
    // TODO: 实现文字推开效果
  }

  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, width, height);

    updateOrbit();
    checkTextCollision();

    drawTrail();
    drawStation(station.x, station.y, station.scale, station.opacity, station.angle);

    animationId = requestAnimationFrame(animate);
  }

  // 清理
  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (canvas) {
      canvas.remove();
    }
    window.removeEventListener('resize', resize);
  }

  // 页面可见性变化时暂停/恢复动画
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      if (!animationId && !prefersReducedMotion) {
        animate();
      }
    }
  });

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出清理函数（供调试用）
  window.tiangongCleanup = destroy;
})();
