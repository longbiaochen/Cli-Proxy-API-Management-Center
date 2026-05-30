import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import styles from './AuthRelationshipCard.module.scss';

export function AuthRelationshipCard() {
  const { t } = useTranslation();

  return (
    <Card title={t('auth_relationship.title')} className={styles.card}>
      <p className={styles.intro}>{t('auth_relationship.intro')}</p>
      <div className={styles.grid}>
        <div className={styles.item}>
          <h3 className={styles.itemTitle}>{t('auth_relationship.provider_title')}</h3>
          <p className={styles.itemText}>{t('auth_relationship.provider_desc')}</p>
        </div>
        <div className={styles.item}>
          <h3 className={styles.itemTitle}>{t('auth_relationship.oauth_title')}</h3>
          <p className={styles.itemText}>{t('auth_relationship.oauth_desc')}</p>
        </div>
        <div className={styles.item}>
          <h3 className={styles.itemTitle}>{t('auth_relationship.auth_files_title')}</h3>
          <p className={styles.itemText}>{t('auth_relationship.auth_files_desc')}</p>
        </div>
      </div>
      <div className={styles.footer}>
        {t('auth_relationship.footer_prefix')} <code>codex-longbiaochen@me.com-pro.json</code>{' '}
        {t('auth_relationship.footer_suffix')}
      </div>
    </Card>
  );
}
