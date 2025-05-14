// src/__tests__/audio/AudioCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioCard from '@/components/audio/AudioCard';
import type { AudioMetadata } from '@/types/audio';

describe('AudioCard Component', () => {
  const mockAudioMP3: AudioMetadata = {
    id: 'mp3-test',
    title: 'Test MP3 Audio',
    description: 'This is a test MP3 file.',
    filename: 'test_audio.mp3',
    category: 'Test Category',
    mimeType: 'audio/mpeg',
  };

  const mockAudioWAV: AudioMetadata = {
    id: 'wav-test',
    title: 'Test WAV Audio',
    description: 'This is a test WAV file.',
    filename: 'test_audio.wav',
    mimeType: 'audio/wav',
  };

  const mockAudioMPG: AudioMetadata = {
    id: 'mpg-test',
    title: 'Test MPG Audio',
    description: 'This is a test MPG file.',
    filename: 'test_audio.mpg',
    mimeType: 'audio/mpeg',
  };
  
  const mockAudioNoMime: AudioMetadata = {
    id: 'no-mime-test',
    title: 'Test Audio No Mime',
    description: 'Test with filename-derived MIME type.',
    filename: 'another_test.ogg', // .ogg should resolve to audio/ogg
  };

  test('renders correctly with MP3 metadata', () => {
    render(<AudioCard audio={mockAudioMP3} />);
    expect(screen.getByText(mockAudioMP3.title)).toBeInTheDocument();
    expect(screen.getByText(mockAudioMP3.description)).toBeInTheDocument();
    
    const audioElement = screen.getByRole('region').querySelector('audio'); // querySelector as audio is not a direct role
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute('controls');
    
    const sourceElement = audioElement?.querySelector('source');
    expect(sourceElement).toBeInTheDocument();
    expect(sourceElement).toHaveAttribute('src', `/data/audio/${mockAudioMP3.filename}`);
    expect(sourceElement).toHaveAttribute('type', 'audio/mpeg');
  });

  test('renders correctly with WAV metadata', () => {
    render(<AudioCard audio={mockAudioWAV} />);
    expect(screen.getByText(mockAudioWAV.title)).toBeInTheDocument();
    const audioElement = screen.getByRole('region').querySelector('audio');
    const sourceElement = audioElement?.querySelector('source');
    expect(sourceElement).toHaveAttribute('src', `/data/audio/${mockAudioWAV.filename}`);
    expect(sourceElement).toHaveAttribute('type', 'audio/wav');
  });

  test('renders correctly with MPG metadata (as audio/mpeg)', () => {
    render(<AudioCard audio={mockAudioMPG} />);
    expect(screen.getByText(mockAudioMPG.title)).toBeInTheDocument();
    const audioElement = screen.getByRole('region').querySelector('audio');
    const sourceElement = audioElement?.querySelector('source');
    expect(sourceElement).toHaveAttribute('src', `/data/audio/${mockAudioMPG.filename}`);
    expect(sourceElement).toHaveAttribute('type', 'audio/mpeg');
  });

  test('derives MIME type if not provided (e.g., .ogg)', () => {
    render(<AudioCard audio={mockAudioNoMime} />);
    const audioElement = screen.getByRole('region').querySelector('audio');
    const sourceElement = audioElement?.querySelector('source');
    expect(sourceElement).toHaveAttribute('src', `/data/audio/${mockAudioNoMime.filename}`);
    expect(sourceElement).toHaveAttribute('type', 'audio/ogg');
  });

  test('renders error card if filename is invalid or missing', () => {
    const invalidAudio: AudioMetadata = {
      id: 'invalid-test',
      title: 'Invalid Audio',
      description: 'This audio has no filename.',
      filename: '', // Invalid filename
    };
    render(<AudioCard audio={invalidAudio} />);
    expect(screen.getByText(/Audio Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid audio data provided to card/i)).toBeInTheDocument();
    expect(screen.queryByRole('audio')).not.toBeInTheDocument();
  });

  test('renders with minimal metadata (only id, title, filename)', () => {
    const minimalAudio: AudioMetadata = {
      id: 'minimal-test',
      title: 'Minimal Audio Title',
      filename: 'minimal.mp3',
      description: '', // Empty description
    };
    render(<AudioCard audio={minimalAudio} />);
    expect(screen.getByText(minimalAudio.title)).toBeInTheDocument();
    expect(screen.getByText(`Audio file: ${minimalAudio.filename}`)).toBeInTheDocument(); // Fallback description
    const audioElement = screen.getByRole('region').querySelector('audio');
    const sourceElement = audioElement?.querySelector('source');
    expect(sourceElement).toHaveAttribute('src', `/data/audio/${minimalAudio.filename}`);
    expect(sourceElement).toHaveAttribute('type', 'audio/mpeg'); // Derived from .mp3
  });

  test('handles unknown extension by defaulting to audio/mpeg and warning', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const unknownExtAudio: AudioMetadata = {
      id: 'unknown-ext',
      title: 'Unknown Extension',
      description: 'Test .xyz extension',
      filename: 'audio.xyz',
    };
    render(<AudioCard audio={unknownExtAudio} />);
    const audioElement = screen.getByRole('region').querySelector('audio');
    const sourceElement = audioElement?.querySelector('source');
    expect(sourceElement).toHaveAttribute('type', 'audio/mpeg');
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown audio extension ".xyz"'));
    consoleWarnSpy.mockRestore();
  });
});
