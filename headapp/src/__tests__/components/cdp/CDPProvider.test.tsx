import React from 'react';
import { render, screen } from '@testing-library/react';
import { CDPProvider, useRecentlyViewedCdp } from '@/components/cdp/CDPProvider';
import { getEngage } from '@/lib/cdp/engage';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}));

// Mock engage
jest.mock('@/lib/cdp/engage', () => {
  const pageView = jest.fn().mockResolvedValue({ ref: 'mock-guest-ref' });
  const getBrowserId = jest.fn().mockReturnValue('mock-browser-id');
  const getGuestId = jest.fn().mockResolvedValue('mock-guest-ref');
  return {
    getEngage: jest.fn().mockResolvedValue({
      pageView,
      getBrowserId,
      getGuestId,
    }),
  };
});

describe('CDPProvider', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [{ id: '1', title: 'Post 1' }] }),
    });
    global.fetch = fetchMock;
  });

  const TestComponent = () => {
    const { recentlyViewed, guestRef, trackPostClick } = useRecentlyViewedCdp();
    return (
      <div>
        <div data-testid="guest-ref">{guestRef || 'no-guest-ref'}</div>
        <div data-testid="items-count">{recentlyViewed.length}</div>
        {recentlyViewed.map((item) => (
          <div key={item.id} data-testid="post-title">
            {item.title}
          </div>
        ))}
        <button
          data-testid="click-btn"
          onClick={() => trackPostClick({ id: '2', title: 'Post 2' })}
        >
          Track Click
        </button>
      </div>
    );
  };

  it('initializes engage, sends page view, and fetches recently viewed posts', async () => {
    render(
      <CDPProvider>
        <TestComponent />
      </CDPProvider>
    );

    await screen.findByText('mock-guest-ref', {}, { timeout: 3000 });

    const engage = await getEngage();

    expect(getEngage).toHaveBeenCalled();
    expect(engage.pageView).toHaveBeenCalledWith(
      {
        channel: 'WEB',
        currency: 'USD',
        page: '/test-path',
      },
      expect.objectContaining({
        path: '/test-path',
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/recently-viewed?guestRef=mock-guest-ref',
      expect.any(Object)
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(screen.getByTestId('post-title')).toHaveTextContent('Post 1');
  });

  it('allows tracking post click and does optimistic update plus API call', async () => {
    render(
      <CDPProvider>
        <TestComponent />
      </CDPProvider>
    );

    await screen.findByText('mock-guest-ref', {}, { timeout: 3000 });

    const clickBtn = screen.getByTestId('click-btn');
    fetchMock.mockClear();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [{ id: '2', title: 'Post 2' }, { id: '1', title: 'Post 1' }] }),
    });

    clickBtn.click();

    await screen.findByText('Post 2', {}, { timeout: 3000 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/recently-viewed',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          guestRef: 'mock-guest-ref',
          post: { id: '2', title: 'Post 2' },
        }),
      })
    );
  });
});
