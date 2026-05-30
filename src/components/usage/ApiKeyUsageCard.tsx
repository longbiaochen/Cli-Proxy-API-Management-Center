import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCompactNumber } from '@/utils/usage';
import type { UiMetaUsageEntry } from '@/services/api/uiMeta';
import styles from './ApiKeyUsageCard.module.scss';

type SortKey = 'total_tokens' | 'total_requests' | 'recent_request_at';

const ALL_VALUE = '__all__';

export function ApiKeyUsageCard({
  entries,
  loading,
}: {
  entries: UiMetaUsageEntry[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [aliasFilter, setAliasFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [modelFilter, setModelFilter] = useState(ALL_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_VALUE);
  const [sortKey, setSortKey] = useState<SortKey>('total_tokens');

  const modelOptions = useMemo(() => {
    const models = new Set<string>();
    entries.forEach((entry) => {
      Object.keys(entry.models || {}).forEach((model) => models.add(model));
    });
    return [
      { value: ALL_VALUE, label: t('usage_stats.filter_all') },
      ...Array.from(models).sort().map((model) => ({ value: model, label: model })),
    ];
  }, [entries, t]);

  const statusOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: t('usage_stats.filter_all') },
      { value: 'active', label: t('api_key_metadata.active') },
      { value: 'retired', label: t('api_key_metadata.retired') },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () => [
      { value: 'total_tokens', label: t('usage_stats.total_tokens') },
      { value: 'total_requests', label: t('usage_stats.total_requests') },
      { value: 'recent_request_at', label: t('api_key_usage.recent_request_at') },
    ],
    [t]
  );

  const filteredEntries = useMemo(() => {
    const aliasNeedle = aliasFilter.trim().toLowerCase();
    const ownerNeedle = ownerFilter.trim().toLowerCase();
    const next = entries.filter((entry) => {
      const aliasMatched = !aliasNeedle || entry.alias.toLowerCase().includes(aliasNeedle);
      const ownerMatched = !ownerNeedle || entry.owner.toLowerCase().includes(ownerNeedle);
      const modelMatched =
        modelFilter === ALL_VALUE || Object.prototype.hasOwnProperty.call(entry.models || {}, modelFilter);
      const statusMatched =
        statusFilter === ALL_VALUE ||
        (statusFilter === 'active' ? entry.active : !entry.active);
      return aliasMatched && ownerMatched && modelMatched && statusMatched;
    });

    next.sort((left, right) => {
      if (sortKey === 'recent_request_at') {
        return (right.recent_request_at || '').localeCompare(left.recent_request_at || '');
      }
      return (right[sortKey] || 0) - (left[sortKey] || 0);
    });
    return next;
  }, [aliasFilter, entries, modelFilter, ownerFilter, sortKey, statusFilter]);

  return (
    <Card title={t('api_key_usage.title')}>
      <div className={styles.hint}>{t('api_key_usage.hint')}</div>
      <div className={styles.toolbar}>
        <Input
          value={aliasFilter}
          onChange={(event) => setAliasFilter(event.target.value)}
          placeholder={t('api_key_usage.filter_alias_placeholder')}
        />
        <Input
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          placeholder={t('api_key_usage.filter_owner_placeholder')}
        />
        <Select
          value={modelFilter}
          options={modelOptions}
          onChange={(value) => setModelFilter(value)}
          ariaLabel={t('api_key_usage.filter_model')}
        />
        <Select
          value={statusFilter}
          options={statusOptions}
          onChange={(value) => setStatusFilter(value)}
          ariaLabel={t('api_key_usage.filter_status')}
        />
      </div>
      <div className={styles.toolbar}>
        <Select
          value={sortKey}
          options={sortOptions}
          onChange={(value) => setSortKey(value as SortKey)}
          ariaLabel={t('api_key_usage.sort_by')}
        />
      </div>
      {loading ? (
        <div className={styles.hint}>{t('common.loading')}</div>
      ) : filteredEntries.length === 0 ? (
        <div className={styles.hint}>{t('usage_stats.no_data')}</div>
      ) : (
        <div className={styles.table}>
          {filteredEntries.map((entry) => (
            <div key={entry.key} className={styles.row}>
              <div className={styles.rowTop}>
                <div className={styles.identity}>
                  <p className={styles.alias}>{entry.alias}</p>
                  <div className={styles.owner}>{entry.owner || t('api_key_metadata.owner_empty')}</div>
                  <div className={styles.meta}>
                    <span className={`${styles.badge} ${entry.active ? styles.active : styles.retired}`}>
                      {entry.active ? t('api_key_metadata.active') : t('api_key_metadata.retired')}
                    </span>
                    <span className={styles.badge}>{entry.key}</span>
                    {entry.recent_request_at ? (
                      <span className={styles.badge}>
                        {t('api_key_usage.recent_request_at')}: {entry.recent_request_at}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className={styles.stats}>
                  <div>
                    <span className={styles.statLabel}>{t('usage_stats.total_requests')}</span>
                    <span className={styles.statValue}>{entry.total_requests.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className={styles.statLabel}>{t('usage_stats.total_tokens')}</span>
                    <span className={styles.statValue}>{formatCompactNumber(entry.total_tokens)}</span>
                  </div>
                  <div>
                    <span className={styles.statLabel}>{t('api_key_usage.models_count')}</span>
                    <span className={styles.statValue}>{Object.keys(entry.models || {}).length}</span>
                  </div>
                </div>
              </div>
              <div className={styles.models}>
                {Object.keys(entry.models || {}).sort().map((model) => (
                  <span key={model} className={styles.badge}>
                    {model}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
