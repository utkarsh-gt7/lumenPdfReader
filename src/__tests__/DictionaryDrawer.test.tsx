import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DictionaryDrawer from '@/components/reader/DictionaryDrawer';

const lookupMock = vi.fn();
vi.mock('@/services/dictionary', () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}));

const sampleEntry = {
  word: 'serendipity',
  phonetic: '/sɛr/',
  audioUrl: 'https://example/serendipity.mp3',
  meanings: [
    {
      partOfSpeech: 'noun',
      definition: 'A happy accident.',
      example: 'A fortunate stroke.',
      synonyms: ['fluke'],
    },
  ],
  source: 'https://en.wiktionary.org',
};

beforeEach(() => {
  lookupMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<DictionaryDrawer />', () => {
  it('renders the empty state when no term is supplied', () => {
    render(<DictionaryDrawer open onClose={vi.fn()} initialTerm={null} />);
    expect(screen.getByText(/Look up any word/i)).toBeInTheDocument();
  });

  it('looks up an initial term and renders the entry', async () => {
    lookupMock.mockResolvedValue(sampleEntry);
    render(<DictionaryDrawer open onClose={vi.fn()} initialTerm="serendipity" />);
    await waitFor(() => {
      expect(lookupMock).toHaveBeenCalledWith('serendipity');
    });
    expect(await screen.findByText('serendipity')).toBeInTheDocument();
    expect(screen.getByText('A happy accident.')).toBeInTheDocument();
    expect(screen.getByText(/noun/i)).toBeInTheDocument();
  });

  it('shows a friendly error when the lookup throws', async () => {
    lookupMock.mockRejectedValue(new Error('No definition'));
    render(<DictionaryDrawer open onClose={vi.fn()} initialTerm="zzzzzz" />);
    await waitFor(() => {
      expect(screen.getByText(/No definition/)).toBeInTheDocument();
    });
  });

  it('lets the user search manually', async () => {
    lookupMock.mockResolvedValue(sampleEntry);
    const user = userEvent.setup();
    render(<DictionaryDrawer open onClose={vi.fn()} initialTerm={null} />);
    await user.type(screen.getByPlaceholderText(/Look up a word/i), 'foo');
    await user.click(screen.getByRole('button', { name: /Define/i }));
    await waitFor(() => {
      expect(lookupMock).toHaveBeenCalledWith('foo');
    });
  });

  it('plays audio when the speaker icon is clicked', async () => {
    lookupMock.mockResolvedValue(sampleEntry);
    const playSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve());
    const user = userEvent.setup();
    render(<DictionaryDrawer open onClose={vi.fn()} initialTerm="serendipity" />);
    await screen.findByText('serendipity');
    await user.click(screen.getByLabelText(/Play pronunciation/i));
    expect(playSpy).toHaveBeenCalled();
  });
});
