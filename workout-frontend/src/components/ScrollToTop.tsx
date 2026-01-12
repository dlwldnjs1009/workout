import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - 페이지 전환 시 스크롤을 최상단으로 초기화
 *
 * 문제: 페이지 진입 시 중간/하단에서 시작하는 버그
 * 해결: pathname 변경 시 window.scrollTo(0, 0) 호출
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 페이지 전환 시 즉시 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
