import React from 'react';
import { IconShieldQuestion } from '@tabler/icons-react';
import LazyImage from '@/app/components/generic/LazyImage';
import { Monster } from '@/types/Monster';
import { getCdnImage } from '@/utils';

interface MonsterResultsTitleProps {
  monster: Monster;
}

const MonsterResultsTitle: React.FC<MonsterResultsTitleProps> = (props) => {
  const { monster } = props;

  return (
    <h2 className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight dark:text-white">
      <div className="flex h-10 w-10 items-center justify-center">
        {monster.image ? (
          <LazyImage
            responsive
            src={getCdnImage(`monsters/${monster.image}`)}
            alt={monster.name || 'Unknown'}
          />
        ) : (
          <IconShieldQuestion className="text-gray-300" />
        )}
      </div>
      <div className="flex min-w-0 flex-col leading-5">
        <span>
          Results vs
          {' '}
          {monster.name}
        </span>
        {monster.version && (
          <span className="text-xs text-gray-500 dark:text-gray-300">
            #
            {monster.version}
          </span>
        )}
      </div>
    </h2>
  );
};

export default MonsterResultsTitle;
