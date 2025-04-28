'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function TimelinePage() {
  const [noteContent, setNoteContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [yearNotes, setYearNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('');
  const [isWritingMode, setIsWritingMode] = useState(false);

  // 獲取當前時間的詳細信息
  const getTimeDetails = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      week: Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)),
      date: now.getDate(),
      dayOfWeek: now.getDay(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      timestamp: now.getTime()
    };
  };

  // 獲取當年的筆記
  const fetchYearNotes = async () => {
    try {
      setIsLoading(true);
      const currentYear = new Date().getFullYear();
      
      // 簡化查詢，只按年份篩選
      const notesQuery = query(
        collection(db, 'notes'),
        where('timeDetails.year', '==', currentYear)
      );

      const querySnapshot = await getDocs(notesQuery);
      // 在客戶端進行排序
      const notes = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => b.timeDetails.timestamp - a.timeDetails.timestamp);

      setYearNotes(notes);
    } catch (error) {
      console.error('獲取筆記時發生錯誤：', error);
      alert('獲取筆記失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存筆記到 Firebase
  const saveNote = async () => {
    if (!noteContent.trim()) {
      alert('請輸入筆記內容');
      return;
    }

    try {
      setIsSaving(true);
      const timeDetails = getTimeDetails();
      
      await addDoc(collection(db, 'notes'), {
        content: noteContent,
        topic: selectedTopic || '日記隨筆',
        timeDetails,
        createdAt: serverTimestamp(),
      });
      
      // 如果當前正在查看年度筆記，則重新獲取
      if (selectedTimeRange === '今年') {
        await fetchYearNotes();
      }

      // 清空筆記內容
      setNoteContent('');
      setSelectedTopic('');
      alert('筆記已儲存！');
    } catch (error) {
      console.error('儲存筆記時發生錯誤：', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  // 格式化時間
  const formatTime = (timeDetails) => {
    return `${timeDetails.month}月${timeDetails.date}日 ${String(timeDetails.hour).padStart(2, '0')}:${String(timeDetails.minute).padStart(2, '0')}`;
  };

  // 獲取主題對應的表情符號
  const getTopicEmoji = (topic) => {
    const emojiMap = {
      '日記隨筆': '📝',
      '健康紀錄': '🏋🏻‍♀️',
      '軟體開發': '👩🏻‍💻',
      '其他學習': '📚'
    };
    return emojiMap[topic] || '📝';
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-900">
      {/* 左側面板 - 時間軸區域 */}
      <div className="w-[15%] bg-gray-50 dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 pt-4 pl-4">
          {/* 頭像和標題 */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-5 h-5 rounded-full overflow-hidden">
              <Image
                src="/images/min.jpg"
                alt="Min's avatar"
                width={20}
                height={20}
                className="object-cover"
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Min's LifeNote</span>
          </div>

          {/* 時間顯示區域 */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-600 mb-3">時間顯示</h3>
            <div className="space-y-1">
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">本週</span>
                </div>
              </div>
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">本月</span>
                </div>
              </div>
              <div 
                className={`flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selectedTimeRange === '今年' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                onClick={() => {
                  setSelectedTimeRange('今年');
                  fetchYearNotes();
                }}
              >
                <div className="w-8 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">今年</span>
                </div>
              </div>
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">2年</span>
                </div>
              </div>
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">全部人生</span>
                </div>
              </div>
            </div>
          </div>

          {/* 主題清單 */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-600 mb-3">主題清單</h3>
            <div className="space-y-1">
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400">📝</span>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">日記隨筆</span>
                </div>
              </div>
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400">🏋🏻‍♀️</span>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">健康紀錄</span>
                </div>
              </div>
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400">👩🏻‍💻</span>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">軟體開發</span>
                </div>
              </div>
              <div className="flex items-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <div className="w-8 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400">📚</span>
                </div>
                <div className="w-20">
                  <span className="text-sm text-gray-500 dark:text-gray-400">其他學習</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 右側面板 - 內容區域 */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <div className="p-6 h-full">
          <div className="max-w-3xl mx-auto h-full">
            {!isWritingMode ? (
              // 正常模式：顯示時間軸和筆記列表
              <div className="flex flex-col items-center h-full">
                {/* 年份和月份區域 */}
                <div className="grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(5,1fr)] gap-1">
                  {Array.from({ length: 100 }).map((_, index) => (
                    <div 
                      key={index}
                      className={`h-6 w-10 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-xs ${
                        index < 30 ? 'text-gray-400 dark:text-gray-500 bg-yellow-100 dark:bg-yellow-900' : 
                        index === 30 ? 'text-white animate-gradient bg-gradient-to-r from-green-300 via-yellow-300 to-pink-300 bg-[length:200%_auto]' : 
                        'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {1995 + index}
                    </div>
                  ))}
                </div>
                
                {/* 月份格子 */}
                <div className="grid grid-cols-12 gap-[0.125rem] mt-4" style={{ width: 'calc(20 * 2.5rem + 19 * 0.25rem)' }}>
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div 
                      key={index}
                      className="h-6 bg-gray-100 dark:bg-gray-700 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-xs text-gray-400 dark:text-gray-500"
                      style={{ width: 'calc((20 * 2.5rem + 19 * 0.25rem - 11 * 0.125rem) / 12)' }}
                    >
                      {index + 1}月
                    </div>
                  ))}
                </div>

                {/* 日期格子 */}
                <div className="flex gap-[0.125rem] mt-4" style={{ width: 'calc(20 * 2.5rem + 19 * 0.25rem)' }}>
                  {Array.from({ length: 30 }).map((_, index) => (
                    <div 
                      key={index}
                      className="h-6 bg-gray-100 dark:bg-gray-700 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-xs text-gray-400 dark:text-gray-500"
                      style={{ width: 'calc((20 * 2.5rem + 19 * 0.25rem - 29 * 0.125rem) / 30)' }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>

                {/* 筆記區域 */}
                <div className="mt-8 w-full space-y-4" style={{ width: 'calc(20 * 2.5rem + 19 * 0.25rem)' }}>
                  {selectedTimeRange === '今年' && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {getTimeDetails().year}年的筆記
                      </h2>
                      {isLoading ? (
                        <div className="text-center py-4 text-gray-500">載入中...</div>
                      ) : yearNotes.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">還沒有任何筆記</div>
                      ) : (
                        yearNotes.map(note => (
                          <div 
                            key={note.id} 
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xl">{getTopicEmoji(note.topic)}</span>
                                <span className="text-sm text-gray-500">{note.topic}</span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatTime(note.timeDetails)}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 寫作模式：全屏筆記輸入區域
              <div className="h-full flex flex-col">
                <div className="flex-1 relative bg-white dark:bg-gray-800 rounded-[20px] shadow-lg" style={{ border: '2px solid #e5e7eb' }}>
                  {/* 紙張紋理 */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXBlciIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMCA0MEg0MFYwSDBaIiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXBlcikiLz48L3N2Zz4=')] opacity-50 rounded-[30px]"></div>
                  
                  {/* 筆記內容 */}
                  <textarea 
                    className="relative w-full h-full bg-transparent text-gray-800 dark:text-gray-200 text-lg leading-relaxed font-serif focus:outline-none resize-none p-8"
                    placeholder="在此輸入您的筆記..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />

                  {/* 按鈕區域 */}
                  <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center">
                    {/* 主題按鈕組 */}
                    <div className="flex space-x-2">
                      <button 
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '日記隨筆' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => setSelectedTopic('日記隨筆')}
                      >
                        <span className="text-xl">📝</span>
                      </button>
                      <button 
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '健康紀錄' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => setSelectedTopic('健康紀錄')}
                      >
                        <span className="text-xl">🏋🏻‍♀️</span>
                      </button>
                      <button 
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '軟體開發' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => setSelectedTopic('軟體開發')}
                      >
                        <span className="text-xl">👩🏻‍💻</span>
                      </button>
                      <button 
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '其他學習' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        onClick={() => setSelectedTopic('其他學習')}
                      >
                        <span className="text-xl">📚</span>
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      {/* 取消按鈕 */}
                      <button 
                        className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-colors"
                        onClick={() => {
                          setIsWritingMode(false);
                          setNoteContent('');
                          setSelectedTopic('');
                        }}
                      >
                        取消
                      </button>

                      {/* 送出按鈕 */}
                      <button 
                        className={`px-4 py-1.5 ${isSaving ? 'bg-gray-400' : 'bg-yellow-400 hover:bg-yellow-300'} text-white rounded-full text-sm font-medium transition-colors`}
                        onClick={async () => {
                          await saveNote();
                          if (!isSaving) {
                            setIsWritingMode(false);
                          }
                        }}
                        disabled={isSaving}
                      >
                        {isSaving ? '儲存中...' : '送出'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 懸浮按鈕 */}
        {!isWritingMode && (
          <div className="fixed bottom-8 right-8 group">
            <button 
              className="w-14 h-14 bg-yellow-400 hover:bg-yellow-300 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              aria-label="新增筆記"
              onClick={() => setIsWritingMode(true)}
            >
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
            </button>
            
            {/* 工具提示 */}
            <div className="absolute bottom-full right-0 mb-2 pointer-events-none">
              <div className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                新增筆記
                {/* 工具提示小箭頭 */}
                <div className="absolute bottom-0 right-6 transform translate-y-full">
                  <div className="w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 筆記輸入浮層 */}
        {isWritingMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-full max-w-4xl h-[80vh] mx-4 bg-white dark:bg-gray-800 rounded-[20px] shadow-2xl relative">
              {/* 紙張紋理 */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXBlciIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMCA0MEg0MFYwSDBaIiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXBlcikiLz48L3N2Zz4=')] opacity-50 rounded-[20px] pointer-events-none"></div>
              
              {/* 筆記內容 */}
              <textarea 
                className="relative w-full h-[calc(100%-80px)] bg-transparent text-gray-800 dark:text-gray-200 text-lg leading-relaxed font-serif focus:outline-none resize-none p-8"
                placeholder="在此輸入您的筆記..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                autoFocus
              />

              {/* 按鈕區域 */}
              <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center">
                {/* 主題按鈕組 */}
                <div className="flex space-x-2">
                  <button 
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '日記隨筆' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    onClick={() => setSelectedTopic('日記隨筆')}
                  >
                    <span className="text-xl">📝</span>
                  </button>
                  <button 
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '健康紀錄' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    onClick={() => setSelectedTopic('健康紀錄')}
                  >
                    <span className="text-xl">🏋🏻‍♀️</span>
                  </button>
                  <button 
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '軟體開發' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    onClick={() => setSelectedTopic('軟體開發')}
                  >
                    <span className="text-xl">👩🏻‍💻</span>
                  </button>
                  <button 
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${selectedTopic === '其他學習' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    onClick={() => setSelectedTopic('其他學習')}
                  >
                    <span className="text-xl">📚</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  {/* 取消按鈕 */}
                  <button 
                    className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-colors"
                    onClick={() => {
                      setIsWritingMode(false);
                      setNoteContent('');
                      setSelectedTopic('');
                    }}
                  >
                    取消
                  </button>

                  {/* 送出按鈕 */}
                  <button 
                    className={`px-4 py-1.5 ${isSaving ? 'bg-gray-400' : 'bg-yellow-400 hover:bg-yellow-300'} text-white rounded-full text-sm font-medium transition-colors`}
                    onClick={async () => {
                      await saveNote();
                      if (!isSaving) {
                        setIsWritingMode(false);
                      }
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? '儲存中...' : '送出'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
