'use client';

import { useEffect } from 'react';

export default function CreateMatchFormClient() {
  useEffect(() => {
    const form = document.getElementById('createMatchForm');
    const matchTypeRadios = form?.querySelectorAll('input[name="matchType"]');
    const singlesSection = document.getElementById('singlesSection');
    const doublesSection = document.getElementById('doublesSection');

    // Default to singles section
    singlesSection?.classList.remove('hidden');
    doublesSection?.classList.add('hidden');

    // Toggle sections based on match type
    matchTypeRadios?.forEach(radio => {
      radio.addEventListener('change', function(this: HTMLInputElement) {
        if (this.value === 'SINGLES') {
          singlesSection?.classList.remove('hidden');
          doublesSection?.classList.add('hidden');
        } else {
          singlesSection?.classList.add('hidden');
          doublesSection?.classList.remove('hidden');
        }
      });
    });

    // Basic client-side validation before submission
    form?.addEventListener('submit', function(event) {
      const matchType = form.querySelector('input[name="matchType"]:checked')!;
      
      if ((matchType as HTMLInputElement).value === 'SINGLES') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const player1 = form.querySelector('select[name="player1Id"]')! as HTMLSelectElement;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const player2 = form.querySelector('select[name="player2Id"]')! as HTMLSelectElement;
        
        if (player1.value === '' || player2.value === '') {
          event.preventDefault();
          alert('Please select both players for a singles match');
          return;
        }
      } else if ((matchType as HTMLInputElement).value === 'DOUBLES') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const partnership1Select = form.querySelector('select[name="partnership1Id"]')! as HTMLSelectElement;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const partnership2Select = form.querySelector('select[name="partnership2Id"]')! as HTMLSelectElement;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const newPartnership1Player1 = form.querySelector('select[name="newPartnership1Player1"]')! as HTMLSelectElement;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const newPartnership1Player2 = form.querySelector('select[name="newPartnership1Player2"]')! as HTMLSelectElement;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const newPartnership2Player1 = form.querySelector('select[name="newPartnership2Player1"]')! as HTMLSelectElement;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const newPartnership2Player2 = form.querySelector('select[name="newPartnership2Player2"]')! as HTMLSelectElement;

        // Check if either existing partnership or new partnership is created
        const isPartnership1Valid = 
          partnership1Select.value !== '' || 
          (newPartnership1Player1.value !== '' && newPartnership1Player2.value !== '');
        
        const isPartnership2Valid = 
          partnership2Select.value !== '' || 
          (newPartnership2Player1.value !== '' && newPartnership2Player2.value !== '');

        if (!isPartnership1Valid || !isPartnership2Valid) {
          event.preventDefault();
          alert('Please select or create partnerships for both teams');
          return;
        }
      }
    });

    // Cleanup event listeners if needed
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      form?.removeEventListener('submit', () => {});
      matchTypeRadios?.forEach(radio => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        radio.removeEventListener('change', () => {});
      });
    };
  }, []); // Empty dependency array means this runs once on mount

  return null; // This component doesn't render anything
}
