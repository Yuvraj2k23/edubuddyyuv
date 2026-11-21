import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeExternalUrl,
  sanitizeUserText,
  validateUploadedFile,
  isSafeMediaDataUrl,
  stripSecretsForStorage,
} from '../src/utils/security.js';

describe('Security Utilities', () => {
  it('allows valid https and http URLs and normalizes bare domains', () => {
    assert.equal(sanitizeExternalUrl('https://youtube.com/watch?v=abc'), 'https://youtube.com/watch?v=abc');
    assert.equal(sanitizeExternalUrl('http://example.com/guide'), 'http://example.com/guide');
    assert.equal(sanitizeExternalUrl('khanacademy.org/math'), 'https://khanacademy.org/math');
  });

  it('blocks XSS and unsafe URL schemes (javascript:, data:, vbscript:, file:)', () => {
    assert.equal(sanitizeExternalUrl('javascript:alert(1)'), '');
    assert.equal(sanitizeExternalUrl('  JaVaScRiPt:alert(document.cookie)  '), '');
    assert.equal(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>'), '');
    assert.equal(sanitizeExternalUrl('vbscript:msgbox(1)'), '');
    assert.equal(sanitizeExternalUrl('file:///etc/passwd'), '');
    assert.equal(sanitizeExternalUrl(''), '');
  });

  it('strips control characters and enforces maxLength in sanitizeUserText', () => {
    const dirty = '  Hello\u0000World\u0007!  ';
    assert.equal(sanitizeUserText(dirty), 'HelloWorld!');
    assert.equal(sanitizeUserText('abcdefghij', 5), 'abcde');
    assert.equal(sanitizeUserText(null), '');
  });

  it('validates uploaded files for MIME type, SVG XSS rejection, and size limits', () => {
    assert.deepEqual(
      validateUploadedFile({ name: 'diagram.png', type: 'image/png', size: 1024 }),
      { valid: true, kind: 'image' }
    );
    assert.deepEqual(
      validateUploadedFile({ name: 'notes.md', type: 'text/markdown', size: 512 }),
      { valid: true, kind: 'text' }
    );
    assert.deepEqual(
      validateUploadedFile({ name: 'syllabus.pdf', type: 'application/pdf', size: 2048 }),
      { valid: true, kind: 'pdf' }
    );

    // Block SVG (potential embedded script XSS)
    const svgCheck = validateUploadedFile({ name: 'bad.svg', type: 'image/svg+xml', size: 300 });
    assert.equal(svgCheck.valid, false);

    // Block oversized files (>5MB)
    const hugeCheck = validateUploadedFile({ name: 'big.png', type: 'image/png', size: 10 * 1024 * 1024 });
    assert.equal(hugeCheck.valid, false);

    // Block empty files
    const emptyCheck = validateUploadedFile({ name: 'empty.txt', type: 'text/plain', size: 0 });
    assert.equal(emptyCheck.valid, false);
  });

  it('verifies safe raster image and PDF data URLs while rejecting HTML/SVG data URLs', () => {
    assert.equal(isSafeMediaDataUrl('data:image/png;base64,iVBORw0KGgo='), true);
    assert.equal(isSafeMediaDataUrl('data:application/pdf;base64,JVBERi0xLjQ='), true);
    assert.equal(isSafeMediaDataUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
    assert.equal(isSafeMediaDataUrl('data:text/html;base64,PHNjcmlwdD4='), false);
  });

  it('strips apiKey and apiKeys before persisting preferences to localStorage', () => {
    const raw = {
      theme: 'dark',
      xp: 200,
      apiKey: 'AIzaSySecret',
      apiKeys: { gemini: 'AIzaSySecret', openai: 'sk-secret' },
    };
    const cleaned = stripSecretsForStorage(raw);
    assert.equal(cleaned.theme, 'dark');
    assert.equal(cleaned.xp, 200);
    assert.equal('apiKey' in cleaned, false);
    assert.equal('apiKeys' in cleaned, false);
  });
});
