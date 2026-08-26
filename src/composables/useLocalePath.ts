import { useI18n } from 'vue-i18n';

const localizedRoots = ['/organizations', '/cloud-connect', '/cloud', '/marketplace'];

export function useLocalePath() {
  const { locale } = useI18n();

  return (path: string): string => {
    const englishPath = path.replace(/^\/de(?=\/|$)/, '') || '/';
    if (locale.value !== 'de') return englishPath;
    const isMarketing =
      englishPath === '/' ||
      localizedRoots.some((root) => englishPath === root || englishPath.startsWith(`${root}/`));
    return isMarketing ? `/de${englishPath === '/' ? '' : englishPath}` : englishPath;
  };
}
