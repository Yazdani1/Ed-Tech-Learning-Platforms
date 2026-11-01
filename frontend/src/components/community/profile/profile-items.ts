import { formatDate } from '@/utils/dateTime';
import { htmlToPlainText } from '@/utils/html-text';

import { communityPostHref } from '../common/community-utils';

import type { ProfileLinkItem } from './ProfileLinkList';
import type { Post, ProfileAnswer } from '@/schemas/community.schema';
import type { TFunction } from 'i18next';

/** Characters of an answer shown under its discussion's title. */
const ANSWER_PREVIEW = 180;

export const discussionItems = (posts: Post[], t: TFunction, locale: string): ProfileLinkItem[] =>
  posts.map((post) => ({
    id: post._id,
    title: post.title,
    href: communityPostHref(post._id),
    subtitle: `${post.channel?.name ?? t('community.post.unknownChannel')} - ${formatDate(post.createdAt, locale)}`,
  }));

/** An answer's discussion: `post` for answers, `reply.post` for replies to answers. */
const answerPost = (answer: ProfileAnswer): { _id: string; title: string } | null => {
  if (answer.post && typeof answer.post === 'object') return answer.post;
  return answer.reply?.post ?? null;
};

export const answerItems = (answers: ProfileAnswer[], t: TFunction): ProfileLinkItem[] =>
  answers.map((answer) => {
    const post = answerPost(answer);
    return {
      id: answer._id,
      title: post?.title ?? t('community.profile.replyFallback'),
      href: post ? communityPostHref(post._id) : null,
      subtitle: htmlToPlainText(answer.body).slice(0, ANSWER_PREVIEW),
    };
  });
