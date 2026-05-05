let capture;
let faceMesh;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

function preload() {
  // 載入 FaceMesh 模型
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  // 建立一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  
  // 擷取攝影機影像內容
  capture = createCapture(VIDEO);
  
  // 隱藏預設產生的 HTML5 video 標籤，我們只需要在畫布上繪製
  capture.hide();

  // 開始偵測臉部
  faceMesh.detectStart(capture, gotFaces);
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  // 設定畫布背景顏色為 e7c6ff
  background('#e7c6ff');

  // 計算影像顯示的寬度與高度 (整個畫布寬高的 50%)
  let displayW = width * 0.5;
  let displayH = height * 0.5;

  // 顯示文字：教科414730514
  fill(0); // 設定文字顏色為黑色
  textSize(32); // 設定文字大小
  textAlign(CENTER, BOTTOM); // 水平對齊置中，垂直對齊以底部為準
  
  // 計算文字位置：水平在畫布中間，垂直在影像上方（影像頂部為 height/2 - displayH/2，再扣除 20 像素的間距）
  text("教科414730514", width / 2, (height / 2) - (displayH / 2) - 20);

  // 使用 push() 與 pop() 確保座標轉換只影響這段影像繪製
  push();
  
  // 1. 先將繪圖原點移到畫布正中央
  translate(width / 2, height / 2);
  
  // 2. 進行左右顛倒處理 (水平鏡像)
  // scale(-1, 1) 會沿著 Y 軸翻轉 X 軸座標
  scale(-1, 1);
  
  // 3. 繪製影像
  // 因為已經將原點移至中央且設置了鏡像，我們使用 imageMode(CENTER) 來繪製
  imageMode(CENTER);
  image(capture, 0, 0, displayW, displayH);

  // 如果有偵測到臉部，則繪製指定編號的連線
  if (faces.length > 0) {
    let face = faces[0];
    
    // 臉部最外層輪廓的編號
    let faceSilhouette = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

    // --- 步驟 1：繪製遮罩，讓影像只出現在臉部 ---
    push();
    fill('#fdf0d5'); // 輪廓外背景顏色
    noStroke();
    beginShape();
    // 1. 先畫一個涵蓋整個畫布的巨大外框 (順時針)
    vertex(-width, -height);
    vertex(width, -height);
    vertex(width, height);
    vertex(-width, height);
    
    // 2. 使用 beginContour 在中間挖一個洞 (點的順序建議與外框相反，故採逆時針遍歷)
    beginContour();
    for (let i = faceSilhouette.length - 1; i >= 0; i--) {
      let p = face.keypoints[faceSilhouette[i]];
      let x = map(p.x, 0, capture.width, -displayW / 2, displayW / 2);
      let y = map(p.y, 0, capture.height, -displayH / 2, displayH / 2);
      vertex(x, y);
    }
    endContour();
    endShape(CLOSE);
    pop();

    // --- 步驟 2：繪製原本要求的紅線特徵 (粗細 15) ---
    stroke(255, 0, 0); // 線條採用紅色
    strokeWeight(15);  // 線條粗細改為 15
    noFill();

    // 第一組特徵點編號
    let indices1 = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
    // 第二組特徵點編號
    let indices2 = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];
    // 右眼外圍特徵點編號 (包含 247，並在最後加上起始點以連成一圈)
    let rightEyeOuter = [130, 247, 30, 29, 27, 28, 56, 190, 243, 25, 110, 24, 23, 22, 26, 112, 130];
    // 右眼內圈特徵點編號 (包含 246，並在最後加上起始點以連成一圈)
    let rightEyeInner = [246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33, 246];
    // 左眼外圍特徵點編號 (包含 467，並在最後加上起始點以連成一圈)
    let leftEyeOuter = [463, 414, 286, 258, 257, 259, 260, 467, 359, 255, 339, 254, 253, 252, 256, 341, 463];
    // 左眼內圈特徵點編號 (包含 466，並在最後加上起始點以連成一圈)
    let leftEyeInner = [466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263, 466];

    // 繪製第一組連線
    drawConnectors(face, indices1, displayW, displayH);
    // 繪製第二組連線
    drawConnectors(face, indices2, displayW, displayH);
    // 繪製雙眼外圍與內圈連線
    drawConnectors(face, rightEyeOuter, displayW, displayH);
    drawConnectors(face, rightEyeInner, displayW, displayH);
    drawConnectors(face, leftEyeOuter, displayW, displayH);
    drawConnectors(face, leftEyeInner, displayW, displayH);

    // --- 步驟 3：繪製臉部最外層藍色輪廓 (粗細 2) ---
    stroke(0, 0, 255); // 藍色
    strokeWeight(2);   // 粗細為 2
    drawConnectors(face, faceSilhouette, displayW, displayH);
  }
  
  pop();
}

// 輔助函式：根據編號陣列繪製連線
function drawConnectors(face, indices, displayW, displayH) {
  for (let i = 0; i < indices.length - 1; i++) {
    let p1 = face.keypoints[indices[i]];
    let p2 = face.keypoints[indices[i + 1]];

    // 將原始影像座標映射到畫布顯示區域 (以 0,0 為中心)
    let x1 = map(p1.x, 0, capture.width, -displayW / 2, displayW / 2);
    let y1 = map(p1.y, 0, capture.height, -displayH / 2, displayH / 2);
    let x2 = map(p2.x, 0, capture.width, -displayW / 2, displayW / 2);
    let y2 = map(p2.y, 0, capture.height, -displayH / 2, displayH / 2);

    line(x1, y1, x2, y2);
  }
}

// 當瀏覽器視窗大小改變時，自動調整畫布大小以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
