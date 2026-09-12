import { BrowserWindow } from 'electron'
import * as fs from 'fs'
import pvnImagePath from '../renderer/src/assets/pvn.jpg?asset'

let splashWindow: BrowserWindow | null = null

export function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const splashTexts = [
    'Всегда имейте запас воды',
    'Никогда не курите вулканический мох...',
    'Вы можете стримить любой контент используя WHIP-стриминг, например, с помощью OBS Studio',
    'Мы создали Desert на самых современных технологиях, чтобы обеспечить вам наилучшую производительность и безопасность',
    'Desert делают всего два человека...',
    'Интересно, что я опять забыл перед пушем в прод...',
    'Заработало!',
    'Desert written in Rust, btw!',
    'Привет, мир!',
    'Made by AlexIndustrial & CirManiuz with ❤️',
    'Glory to Seraphim!',
    'У Desert закрытый исходный код, ибо нехуй.',
    'Also try Discord!',
    'Software-содержащий продукт!',
    'Сообщения в чате поддерживают форматирование Markdown',
    'Когда-нибудь будет релиз...',
    'Вы используете Alpha-версию Desert, возможны критические ошибки',
    'Количество побежденных багов: x -> infinity',
    'Да-да-да, мы думали на счет ИИ',
    'Desert создавался ещё до блокировок. Мы просто захотели своё!',
    'Скоро Desert получит продвинутые функции шифрования',
    'Мы храним минимум персональных данных',
    'Остерегайтесь ИЗР\'ов, это сохранит вашу видеокарту!',
    'Отсылки наше всё!',
    'А ещё мы держим сервера Minecraft и Space Engineers',
    'Уберите отсюда C++',
    'Сперва берем укропу, потом кошачью...',
    'Desert независим!',
    'Официальный сайт - desert-chat.ru, другие - подлый обман!',
    'ъуъ, сюка!',
    'Где саппорт? А нету саппорта!',
    'Помогите Даше найти undefined behavior',
    'Вы вот думаете, кто же придумывает эти упоротые сплеши? А это я!',
    'О, это фуру зависимостей на C/C++ разгрузили!',
    'ОКак',
    'Пустой сплеш',
    'Резерв',
    'Desert разрабатывают 2 человека...',
    'Desert разрабатывают 2 пескокопа...',
    'Desert имеет свою интерпретацию групповых чатов - гильдии...',
    'Сделано в России...',
    'У Desert есть маскот, сами угадайте какой...',
    'Приложение, которое сейчас показывает тебе этот сплеш, имеет открытый исходный код!',
    'Если вы хотите помочь с разработкой, напишите мне: @AlexIndustrial',
    'Официальный день рожденья Desert - 08.07.2023',
    'Desert существует в 4-х агрегатных состояниях: web-приложение, настольное приложение (Linux/Mac/Windows), Android приложение и самое загадочное состояние - IOS приложение, которое никто не видел...',
    'График разработки Desert крайне нерегулярный - делаем, когда можем',
    'Бесплатный объём Desert Cloud составляет 1Gb. В будущем расширим, если цены на Enterprise SSD не расширят нам ... сами знаете что.',
    'Во всех приложениях Desert есть возможность выбрать цветовую схему и фон. Темы вдохновлены просьбами людей. Если есть идеи - создайте тикет в форме обратной связи!',
    'Мы многим рискуем, разрабатывая Desert. Наш Frontend/CD докодился до неврита лицевого нерва. Думайте.',
    'Изначально Desert планировался как приватный продукт для очень узкого круга лиц, но сейчас зарегистрироваться может кто угодно!',
    'Мы иногда ведем ТГ-канал. Иногда.',
    'Здесь могла быть ваша реклама! (нет)',
    'Я хз, что ещё сюда написать...',
    'Мемы кончились, остались только слишком локальные...',
    'АААААААААААААААААААААААААААААААА!',
  ]
  const randomSplash = splashTexts[Math.floor(Math.random() * splashTexts.length)]

  let imageBase64 = ''
  try {
    let imageBuffer: Buffer
    try {
      imageBuffer = fs.readFileSync(pvnImagePath)
    } catch {
      imageBuffer = fs.readFileSync(pvnImagePath.replace('app.asar', 'app.asar.unpacked'))
    }
    imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
  } catch (error) {
    console.error('Failed to load pvn.jpg:', error)
  }

  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100vw; height: 100vh;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          background: #1a1a1a;
          font-family: 'Courier New', Consolas, monospace;
          overflow: hidden;
        }
        .title {
          color: #ffffff; font-size: 24px; font-weight: 400;
          margin-bottom: 10px; letter-spacing: 1px;
        }
        .splash-text {
          color: #888888; font-size: 14px;
          margin-bottom: 20px; font-style: italic;
          text-align: center;
          padding: 0 20px;
          max-width: 100%;
        }
        .loader {
          color: #888888; font-size: 18px;
          letter-spacing: 2px; font-weight: bold;
          display: flex; align-items: center;
        }
        .pvn-img {
          width: 20px; height: 20px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 2px;
        }
        .progress-wrap {
          width: 260px;
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }
        .progress-bar {
          width: 100%;
          height: 4px;
          background: #2a2a2a;
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          width: 0%;
          background: #0078d4;
          border-radius: 2px;
          transition: width 0.2s ease;
        }
        .progress-text {
          color: #666;
          font-size: 11px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
      </style>
    </head>
    <body>
      <div class="title">Загрузка Desert</div>
      <div class="splash-text">${randomSplash}</div>
      <div class="loader" id="loader">
        <span>[♿️</span>
        <img class="pvn-img" src="${imageBase64}" />
        <span>🔪🧍🧍🧍🧍🧍🧍🧍]</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
        <div class="progress-text" id="progressText">Проверка обновлений...</div>
      </div>
      <script>
        const loader = document.getElementById('loader');
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        const frames = [
          '[♿️<img class="pvn-img" src="${imageBase64}" />🔪🧍🧍🧍🧍🧍🧍🧍]',
          '[♿️♿️<img class="pvn-img" src="${imageBase64}" />🔪🧍🧍🧍🧍🧍🧍]',
          '[♿️♿️♿️<img class="pvn-img" src="${imageBase64}" />🔪🧍🧍🧍🧍🧍]',
          '[♿️♿️♿️♿️<img class="pvn-img" src="${imageBase64}" />🔪🧍🧍🧍🧍]',
          '[♿️♿️♿️♿️♿️<img class="pvn-img" src="${imageBase64}" />🔪🧍🧍🧍]',
          '[♿️♿️♿️♿️♿️♿️<img class="pvn-img" src="${imageBase64}" />🔪🧍🧍]',
          '[♿️♿️♿️♿️♿️♿️♿️<img class="pvn-img" src="${imageBase64}" />🔪🧍]',
          '[♿️♿️♿️♿️♿️♿️♿️♿️<img class="pvn-img" src="${imageBase64}" />🔪]',
          '[♿️♿️♿️♿️♿️♿️♿️♿️♿️<img class="pvn-img" src="${imageBase64}" />]'
        ];
        let currentFrame = 0;
        setInterval(() => {
          loader.innerHTML = frames[currentFrame];
          currentFrame = (currentFrame + 1) % frames.length;
        }, 300);
        window.setProgress = (percent, label) => {
          fill.style.width = Math.max(0, Math.min(100, percent)) + '%';
          text.textContent = label && label.trim() ? label : percent + '%';
        };
      </script>
    </body>
    </html>
  `

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`)
  splashWindow.center()
}

export function updateSplashProgress(percent: number, label?: string): void {
  if (!splashWindow || splashWindow.isDestroyed()) return
  const safeLabel = (label || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`')
  splashWindow.webContents
    .executeJavaScript(`window.setProgress && window.setProgress(${percent}, "${safeLabel}")`)
    .catch(() => {})
}

export function closeSplashWindow(): void {
  if (splashWindow) {
    splashWindow.close()
    splashWindow = null
  }
}
