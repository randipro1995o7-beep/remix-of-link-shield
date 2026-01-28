import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';

interface DemoLinkButtonProps {
  url?: string;
  source?: string;
  label?: string;
}

export function DemoLinkButton({
  url = 'https://example.com/suspicious-link',
  source = 'WhatsApp',
  label = 'Test Link Interception',
}: DemoLinkButtonProps) {
  const { interceptLink } = useLinkInterception();

  const handleClick = () => {
    interceptLink(url, source);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="lg"
      className="w-full gap-2"
    >
      <ExternalLink className="w-5 h-5" />
      {label}
    </Button>
  );
}
