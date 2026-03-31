import { useEffect, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';
import bridgeMock from '@vkontakte/vk-bridge-mock';

// Определяем, используем ли мы mock, на основе режима разработки
const USE_MOCK = import.meta.env.DEV;

// Моковые данные пользователя
const MOCK_USER = {
  id: 123456789,
  first_name: 'Тестовый',
  last_name: 'Пользователь',
  photo_100: 'https://vk.com/images/camera_100.png',
  photo_200: 'https://vk.com/images/camera_200.png',
  city: { title: 'Москва' },
};

// Выбираем нужный bridge
const activeBridge = USE_MOCK ? bridgeMock : bridge;

export function useVKBridge() {
  const [user, setUser] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Инициализация VK Bridge...');

        // Отправляем событие инициализации
        await activeBridge.send('VKWebAppInit');

        // Получаем данные пользователя
        const userData = await activeBridge.send('VKWebAppGetUserInfo');

        console.log('Пользователь получен:', userData);
        setUser(userData);
        setIsInitialized(true);

      } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Если всё сломалось, показываем заглушку
        setUser(MOCK_USER);
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Простые функции для работы с хранилищем
  const setStorage = async (key: string, value: any) => {
    try {
      if (USE_MOCK) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        await bridge.send('VKWebAppStorageSet', { key, value: JSON.stringify(value) });
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const getStorage = async (key: string) => {
    try {
      if (USE_MOCK) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } else {
        const { keys } = await bridge.send('VKWebAppStorageGet', { keys: [key] });
        return keys[0]?.value ? JSON.parse(keys[0].value) : null;
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      return null;
    }
  };

  return {
    user,
    isInitialized,
    setStorage,
    getStorage,
    isMock: USE_MOCK
  };
}