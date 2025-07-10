import React, { useState, useEffect, useRef } from 'react';
import { getCountryFlag } from '../utils/flags';

type AutocompleteProps = {
  value: string;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
  options: string[];
  disabled?: boolean;
};

const Autocomplete: React.FC<AutocompleteProps> = ({ value, onChange, onSelect, options, disabled }) => {
  const [filtered, setFiltered] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length === 0) {
      setFiltered([]);
      setShow(false);
      return;
    }
    const lowerValue = value.toLowerCase();
    const startsWith = options.filter(opt => opt.toLowerCase().startsWith(lowerValue)).sort();
    const contains = options.filter(opt => !opt.toLowerCase().startsWith(lowerValue) && opt.toLowerCase().includes(lowerValue)).sort();
    const matches = [...startsWith, ...contains];
    setFiltered(matches);
    setShow(matches.length > 0);
    setHighlight(0);
  }, [value, options]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setShow(false);
    onSelect(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show) return;
    if (e.key === 'ArrowDown') {
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlight]) {
      handleSelect(filtered[highlight]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{ width: '100%', padding: 8, fontSize: 16, textAlign: 'center' }}
        autoComplete="off"
        placeholder="Type country name..."
      />
      {show && (
        <ul style={{
          position: 'absolute',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid #ccc',
          zIndex: 10,
          listStyle: 'none',
          margin: 0,
          padding: 0,
          maxHeight: 150,
          overflowY: 'auto',
        }}>
          {filtered.map((opt, i) => (
            <li
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                padding: 8,
                background: i === highlight ? '#eee' : '#fff',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              {getCountryFlag(opt)} {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete; 