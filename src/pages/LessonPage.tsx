import { Navigate, useParams } from 'react-router-dom'

import LessonLayout from '../components/layout/LessonLayout'
import { getLessonBySlug } from '../data/lessons'

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>()
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    return <Navigate to="/" replace />
  }

  const { Component } = lesson

  return (
    <LessonLayout lesson={lesson}>
      <Component />
    </LessonLayout>
  )
}
